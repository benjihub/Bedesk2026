<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingPlan;
use App\Billing\Models\AiBillingSubscription;
use App\Billing\Models\AiBillingTopUp;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiBillingPaymentRequestService
{
    public function __construct(
        private NowPaymentsService $nowPayments,
        private AiBillingNotificationService $notifications,
    ) {
    }

    public function requestPlan(
        AiBillingAccount $account,
        AiBillingPlan $plan,
    ): AiBillingPaymentRequest {
        return $this->createRequest($account, [
            'plan_id' => $plan->id,
            'type' => 'Plan Upgrade',
            'amount' => $plan->monthly_price,
            'notes' => "{$plan->name} plan crypto payment pending",
        ]);
    }

    public function requestTopUp(
        AiBillingAccount $account,
    ): AiBillingPaymentRequest {
        return $this->createRequest($account, [
            'type' => 'Top-Up',
            'amount' => config('ai-billing.top_up_price'),
            'notes' => sprintf(
                '%s AI reply credit top-up crypto payment pending',
                number_format(config('ai-billing.top_up_credits')),
            ),
        ]);
    }

    public function confirmPayment(
        AiBillingPaymentRequest $paymentRequest,
        ?User $admin = null,
        ?string $transactionHash = null,
        ?string $receivedAmount = null,
    ): AiBillingPaymentRequest {
        return DB::transaction(function () use (
            $paymentRequest,
            $admin,
            $transactionHash,
            $receivedAmount,
        ) {
            $activatedTopUp = null;

            $paymentRequest->update([
                'status' => 'paid',
                'provider_status' => 'verified',
                'transaction_hash' =>
                    $transactionHash ?: $paymentRequest->transaction_hash,
                'received_crypto_amount' =>
                    $receivedAmount ?: $paymentRequest->received_crypto_amount,
                'confirmed_by' => $admin?->id,
                'confirmed_at' => now(),
                'paid_at' => now(),
                'notes' => $this->paidNote($paymentRequest),
            ]);

            if ($paymentRequest->type === 'Top-Up') {
                $activatedTopUp = AiBillingTopUp::create([
                    'billing_account_id' => $paymentRequest->billing_account_id,
                    'payment_request_id' => $paymentRequest->id,
                    'purchased_credits' => config('ai-billing.top_up_credits'),
                    'used_credits' => 0,
                    'status' => 'active',
                    'activated_at' => now(),
                    'expires_at' => now()->addHours(
                        config('ai-billing.top_up_expiry_hours'),
                    ),
                ]);
            }

            if ($paymentRequest->type === 'Plan Upgrade') {
                AiBillingSubscription::where(
                    'billing_account_id',
                    $paymentRequest->billing_account_id,
                )
                    ->where('status', 'active')
                    ->update(['status' => 'replaced']);

                $cycleStart = CarbonImmutable::today();
                $renewalDate = $cycleStart->addMonthNoOverflow();

                AiBillingSubscription::create([
                    'billing_account_id' => $paymentRequest->billing_account_id,
                    'plan_id' => $paymentRequest->plan_id,
                    'status' => 'active',
                    'cycle_start' => $cycleStart,
                    'cycle_end' => $renewalDate->subDay(),
                    'renewal_date' => $renewalDate,
                    'activated_at' => now(),
                ]);
            }

            $paymentRequest = $paymentRequest->fresh('plan');
            $this->notifications->paymentConfirmed($paymentRequest);

            if ($activatedTopUp) {
                $this->notifications->topUpActivated($activatedTopUp);
            }

            return $paymentRequest;
        });
    }

    private function createRequest(
        AiBillingAccount $account,
        array $payload,
    ): AiBillingPaymentRequest {
        $paymentRequest = $account->paymentRequests()->create([
            ...$payload,
            'status' => 'pending',
            'currency' => 'IDR',
            'reference' => $this->reference(),
            'crypto_asset' => 'USDT',
            'crypto_network' => 'TRC20',
            'expires_at' => now()->addHours(
                config('ai-billing.payment_request_expiry_hours'),
            ),
        ]);

        $invoice = $this->nowPayments->createInvoice($paymentRequest);

        $paymentRequest->update([
            'expected_crypto_amount' => $invoice['payAmount'] ?? null,
            'crypto_asset' => 'USDT',
            'crypto_network' => 'TRC20',
            'wallet_address' => $invoice['payAddress'] ?? null,
            'provider' => config('ai-billing.payment_provider', 'nowpayments'),
            'provider_payment_id' => $invoice['paymentId'],
            'provider_prepay_id' => $invoice['invoiceId'],
            'provider_status' => $invoice['status'],
            'provider_invoice_url' => $invoice['invoiceUrl'],
            'provider_checkout_url' => $invoice['checkoutUrl'],
            'provider_payload' => [
                'nowPaymentsPricing' => [
                    'priceAmount' => $invoice['priceAmount'] ?? null,
                    'priceCurrency' => $invoice['priceCurrency'] ?? null,
                    'priceRate' => $invoice['priceRate'] ?? null,
                    'priceSource' => $invoice['priceSource'] ?? null,
                    'localAmount' => $paymentRequest->amount,
                    'localCurrency' => $paymentRequest->currency,
                ],
                'nowPaymentsInvoice' => $invoice['payload'],
            ],
            'notes' => 'NOWPayments checkout created',
        ]);

        $paymentRequest = $paymentRequest->fresh('plan');
        $this->notifications->paymentCreated($paymentRequest);

        return $paymentRequest;
    }

    public function reconcilePayment(
        AiBillingPaymentRequest $paymentRequest,
    ): AiBillingPaymentRequest {
        if ($paymentRequest->status !== 'pending') {
            return $paymentRequest;
        }

        if ($paymentRequest->expires_at?->isPast()) {
            $paymentRequest->update([
                'status' => 'cancelled',
                'provider_status' => 'expired',
                'expired_at' => now(),
                'notes' => 'NOWPayments payment request expired',
            ]);

            return $paymentRequest->fresh('plan');
        }

        $verification = $this->nowPayments->fetchPaymentStatus($paymentRequest);

        return $this->applyProviderUpdate($paymentRequest, $verification);
    }

    public function handleNowPaymentsIpn(
        array $payload,
        ?string $signature,
    ): AiBillingPaymentRequest {
        if (!$this->nowPayments->ipnSignatureIsValid($payload, $signature)) {
            Log::warning('NOWPayments IPN rejected: invalid signature.', [
                'orderId' => $payload['order_id'] ?? null,
                'paymentId' => $payload['payment_id'] ?? null,
                'invoiceId' => $payload['invoice_id'] ?? $payload['id'] ?? null,
                'status' => $payload['payment_status'] ?? $payload['status'] ?? null,
                'hasSignature' => (bool) $signature,
            ]);

            abort(403, 'Invalid NOWPayments signature.');
        }

        $paymentRequest = $this->findNowPaymentsRequest($payload);
        $verification = $this->nowPayments->normalizeProviderPayload(
            $payload,
            'NOWPayments IPN received.',
        );

        return $this->applyProviderUpdate($paymentRequest, $verification);
    }

    private function applyProviderUpdate(
        AiBillingPaymentRequest $paymentRequest,
        array $verification,
    ): AiBillingPaymentRequest {
        if (!$this->nowPayments->amountAndCurrencyMatch(
            $paymentRequest,
            $verification['payload'] ?? [],
        )) {
            Log::warning('NOWPayments payment rejected: amount or currency mismatch.', [
                'paymentRequestId' => $paymentRequest->id,
                'reference' => $paymentRequest->reference,
                'localAmount' => $paymentRequest->amount,
                'localCurrency' => $paymentRequest->currency,
                'providerPriceAmount' => data_get(
                    $paymentRequest->provider_payload,
                    'nowPaymentsPricing.priceAmount',
                ),
                'providerPriceCurrency' => data_get(
                    $paymentRequest->provider_payload,
                    'nowPaymentsPricing.priceCurrency',
                ),
                'incomingPriceAmount' => data_get(
                    $verification,
                    'payload.price_amount',
                ),
                'incomingPriceCurrency' => data_get(
                    $verification,
                    'payload.price_currency',
                ),
            ]);

            $paymentRequest->update([
                'provider_status' => 'amount_mismatch',
                'provider_payload' => [
                    ...($paymentRequest->provider_payload ?: []),
                    'nowPaymentsVerification' => $verification,
                ],
                'notes' => 'NOWPayments amount or currency did not match this billing request.',
            ]);

            return $paymentRequest->fresh('plan');
        }

        $paymentRequest->update([
            'provider' => config('ai-billing.payment_provider', 'nowpayments'),
            'provider_payment_id' =>
                $verification['paymentId'] ??
                $paymentRequest->provider_payment_id,
            'provider_prepay_id' =>
                $verification['invoiceId'] ??
                $paymentRequest->provider_prepay_id,
            'provider_status' => $verification['status'],
            'expected_crypto_amount' =>
                $verification['payAmount'] ??
                $paymentRequest->expected_crypto_amount,
            'received_crypto_amount' =>
                $verification['receivedAmount'] ??
                $paymentRequest->received_crypto_amount,
            'transaction_hash' =>
                $verification['transactionHash'] ??
                $paymentRequest->transaction_hash,
            'wallet_address' =>
                $verification['payAddress'] ??
                $paymentRequest->wallet_address,
            'provider_invoice_url' =>
                $verification['invoiceUrl'] ??
                $paymentRequest->provider_invoice_url,
            'provider_checkout_url' =>
                $verification['checkoutUrl'] ??
                $paymentRequest->provider_checkout_url,
            'provider_payload' => [
                ...($paymentRequest->provider_payload ?: []),
                'nowPaymentsVerification' => $verification,
            ],
            'notes' => $verification['message'],
        ]);

        if ($verification['failed'] ?? false) {
            $paymentRequest->update([
                'status' => 'cancelled',
                'expired_at' => now(),
            ]);

            return $paymentRequest->fresh('plan');
        }

        if (
            $paymentRequest->status !== 'paid' &&
            ($verification['verified'] ?? false)
        ) {
            return $this->confirmPayment(
                $paymentRequest->fresh('plan'),
                null,
                $verification['transactionHash'] ??
                    $paymentRequest->transaction_hash,
                $verification['receivedAmount'] ??
                    $paymentRequest->expected_crypto_amount,
            );
        }

        return $paymentRequest->fresh('plan');
    }

    private function findNowPaymentsRequest(array $payload): AiBillingPaymentRequest
    {
        $reference = data_get($payload, 'order_id')
            ?: data_get($payload, 'orderId')
            ?: data_get($payload, 'data.order_id')
            ?: data_get($payload, 'data.orderId')
            ?: data_get($payload, 'payment.order_id')
            ?: data_get($payload, 'payment.orderId')
            ?: data_get($payload, 'payments.0.order_id')
            ?: data_get($payload, 'payments.0.orderId');
        $paymentId = data_get($payload, 'payment_id')
            ?: data_get($payload, 'paymentId')
            ?: data_get($payload, 'data.payment_id')
            ?: data_get($payload, 'data.paymentId')
            ?: data_get($payload, 'payment.payment_id')
            ?: data_get($payload, 'payment.paymentId')
            ?: data_get($payload, 'payments.0.payment_id')
            ?: data_get($payload, 'payments.0.paymentId');
        $invoiceId = data_get($payload, 'invoice_id')
            ?: data_get($payload, 'invoiceId')
            ?: data_get($payload, 'id')
            ?: data_get($payload, 'data.invoice_id')
            ?: data_get($payload, 'data.invoiceId')
            ?: data_get($payload, 'data.id')
            ?: data_get($payload, 'payment.invoice_id')
            ?: data_get($payload, 'payment.invoiceId')
            ?: data_get($payload, 'payments.0.invoice_id')
            ?: data_get($payload, 'payments.0.invoiceId');

        if (!$reference && !$paymentId && !$invoiceId) {
            abort(404, 'NOWPayments payment request was not found.');
        }

        return AiBillingPaymentRequest::query()
            ->with('plan')
            ->where(function ($query) use ($reference, $paymentId, $invoiceId) {
                if ($reference) {
                    $query->orWhere('reference', $reference);
                }

                if ($paymentId) {
                    $query->orWhere('provider_payment_id', (string) $paymentId);
                }

                if ($invoiceId) {
                    $query->orWhere('provider_prepay_id', (string) $invoiceId);
                }
            })
            ->firstOrFail();
    }

    private function reference(): string
    {
        do {
            $reference = 'AIB-' . now()->format('Ymd') . '-' . Str::upper(
                Str::random(6),
            );
        } while (
            AiBillingPaymentRequest::where('reference', $reference)->exists()
        );

        return $reference;
    }

    private function paidNote(AiBillingPaymentRequest $request): string
    {
        if ($request->type === 'Top-Up') {
            return 'Top-up NOWPayments payment confirmed';
        }

        return 'Plan NOWPayments payment confirmed';
    }

    public function isExpiredStatus(?string $status): bool
    {
        return in_array(strtoupper((string) $status), [
            'EXPIRED',
            'CANCELLED',
            'CANCELED',
            'PAY_CLOSED',
            'FAIL',
            'FAILED',
        ], true);
    }
}
