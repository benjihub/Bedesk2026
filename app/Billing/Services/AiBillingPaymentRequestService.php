<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingPlan;
use App\Billing\Models\AiBillingSubscription;
use App\Billing\Models\AiBillingTopUp;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AiBillingPaymentRequestService
{
    public function __construct(
        private CryptoExchangeRateService $exchangeRates,
        private TronSelfCustodyPaymentService $tronPayments,
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
            'crypto_asset' => config('ai-billing.crypto_asset'),
            'crypto_network' => config('ai-billing.crypto_network'),
            'wallet_address' => config('ai-billing.crypto_wallet_address'),
            'expires_at' => now()->addHours(
                config('ai-billing.payment_request_expiry_hours'),
            ),
        ]);

        $quote = $this->exchangeRates->quote(
            (int) $paymentRequest->amount,
            $paymentRequest->currency,
            config('ai-billing.crypto_asset', 'USDT'),
        );

        $expectedAmount = $this->uniqueExpectedCryptoAmount(
            (string) $quote['amount'],
            $paymentRequest,
        );

        $paymentRequest->update([
            'expected_crypto_amount' => $expectedAmount,
            'crypto_asset' => $quote['asset'],
            'crypto_network' => config('ai-billing.crypto_network', 'TRC20'),
            'provider' => config(
                'ai-billing.payment_provider',
                'tron_self_custody',
            ),
            'provider_status' => 'awaiting_transaction',
            'provider_payload' => [
                'exchangeRate' => $quote,
                'uniqueAmount' => [
                    'baseAmount' => $quote['amount'],
                    'expectedAmount' => $expectedAmount,
                    'strategy' => 'rounded_up_plus_unique_cents',
                    'exactAmountRequired' => true,
                ],
            ],
        ]);

        $paymentRequest = $paymentRequest->fresh('plan');
        $this->notifications->paymentCreated($paymentRequest);

        return $paymentRequest;
    }

    public function submitTransaction(
        AiBillingPaymentRequest $paymentRequest,
        string $transactionHash,
    ): AiBillingPaymentRequest {
        if ($paymentRequest->status !== 'pending') {
            return $paymentRequest;
        }

        $paymentRequest->update([
            'transaction_hash' => trim($transactionHash),
            'provider' => config(
                'ai-billing.payment_provider',
                'tron_self_custody',
            ),
            'provider_status' => 'transaction_submitted',
            'notes' => 'TRC20 transaction submitted for verification',
        ]);

        return $this->reconcilePayment($paymentRequest->fresh('plan'));
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
                'notes' => 'TRC20 payment request expired',
            ]);

            return $paymentRequest->fresh('plan');
        }

        if (!$paymentRequest->transaction_hash) {
            $paymentRequest->update([
                'provider_status' => 'awaiting_transaction',
            ]);

            return $paymentRequest->fresh('plan');
        }

        $verification = $this->tronPayments->verify($paymentRequest);

        $paymentRequest->update([
            'provider' => config(
                'ai-billing.payment_provider',
                'tron_self_custody',
            ),
            'provider_status' => $verification['status'],
            'received_crypto_amount' =>
                $verification['receivedAmount'] ??
                $paymentRequest->received_crypto_amount,
            'provider_payload' => [
                ...($paymentRequest->provider_payload ?: []),
                'tronVerification' => $verification,
            ],
            'notes' => $verification['message'],
        ]);

        if (
            $paymentRequest->status !== 'paid' &&
            ($verification['verified'] ?? false)
        ) {
            return $this->confirmPayment(
                $paymentRequest->fresh('plan'),
                null,
                $paymentRequest->transaction_hash,
                $verification['receivedAmount'] ??
                    $paymentRequest->expected_crypto_amount,
            );
        }

        return $paymentRequest->fresh('plan');
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

    private function uniqueExpectedCryptoAmount(
        string $quotedAmount,
        AiBillingPaymentRequest $paymentRequest,
    ): string {
        $baseCents = (int) ceil(((float) $quotedAmount) * 100);
        $baseCents = max(1, $baseCents);

        for ($slot = 1; $slot <= 99; $slot++) {
            $candidate = number_format(
                ($baseCents + $slot) / 100,
                2,
                '.',
                '',
            );

            if (!$this->activePendingAmountExists($paymentRequest, $candidate)) {
                return $candidate;
            }
        }

        $fallbackUnits = ((int) ceil(((float) $quotedAmount) * 10000)) +
            (($paymentRequest->id % 9000) + 1000);

        return number_format($fallbackUnits / 10000, 4, '.', '');
    }

    private function activePendingAmountExists(
        AiBillingPaymentRequest $paymentRequest,
        string $candidate,
    ): bool {
        return AiBillingPaymentRequest::where('id', '!=', $paymentRequest->id)
            ->where('status', 'pending')
            ->where('crypto_asset', $paymentRequest->crypto_asset)
            ->where('crypto_network', config('ai-billing.crypto_network', 'TRC20'))
            ->where('wallet_address', $paymentRequest->wallet_address)
            ->where('expected_crypto_amount', $candidate)
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    private function paidNote(AiBillingPaymentRequest $request): string
    {
        if ($request->type === 'Top-Up') {
            return 'Top-up crypto payment confirmed';
        }

        return 'Plan crypto payment confirmed';
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
