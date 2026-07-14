<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingNotification;
use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingPlan;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;

class AiBillingSummaryService
{
    public function build(AiBillingAccount $account): array
    {
        $subscription = $account->activeSubscription()->with('plan')->first();
        $plan = $subscription->plan;
        $monthlyUsed = $subscription
            ? (int) $account
                ->usageLedger()
                ->where('subscription_id', $subscription->id)
                ->sum('credits')
            : 0;

        $topUps = $account
            ->topUps()
            ->latest('expires_at')
            ->get()
            ->map(fn($topUp) => [
                'id' => $topUp->id,
                'purchasedCredits' => $topUp->purchased_credits,
                'usedCredits' => $topUp->used_credits,
                'expiresAt' => $this->date($topUp->expires_at),
                'status' => $topUp->expires_at?->isPast()
                    ? 'expired'
                    : $topUp->status,
            ])
            ->values();

        $pendingRequests = $account
            ->paymentRequests()
            ->with('plan')
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn(AiBillingPaymentRequest $request) => $this->paymentRequest($request))
            ->values();

        $paymentHistory = $this->paymentHistory($account, 5);

        $notifications = $account
            ->notifications()
            ->latest('notified_at')
            ->limit(8)
            ->get()
            ->map(fn(AiBillingNotification $notification) => [
                'id' => $notification->id,
                'event' => $notification->event,
                'tone' => $notification->tone,
                'title' => $notification->title,
                'message' => $notification->message,
                'data' => $notification->data,
                'notifiedAt' => $this->dateTime($notification->notified_at),
            ])
            ->values();

        return [
            'account' => [
                'id' => $account->id,
                'name' => $account->name,
                'status' => $account->status,
            ],
            'plan' => $this->plan($plan),
            'subscription' => [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'cycleStart' => $this->date($subscription->cycle_start),
                'cycleEnd' => $this->date($subscription->cycle_end),
                'renewalDate' => $this->date($subscription->renewal_date),
            ],
            'usage' => [
                'monthlyUsed' => $monthlyUsed,
                'monthlyRemaining' => max(
                    $plan->included_credits - $monthlyUsed,
                    0,
                ),
            ],
            'topUps' => $topUps,
            'plans' => AiBillingPlan::where('active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn(AiBillingPlan $plan) => $this->plan($plan))
                ->values(),
            'pendingRequests' => $pendingRequests,
            'paymentHistory' => $paymentHistory,
            'notifications' => $notifications,
            'alerts' => $this->alerts($monthlyUsed, $plan->included_credits),
            'topUpPackage' => [
                'price' => config('ai-billing.top_up_price'),
                'credits' => config('ai-billing.top_up_credits'),
                'expiryHours' => config('ai-billing.top_up_expiry_hours'),
            ],
            'crypto' => [
                'asset' => config('ai-billing.crypto_asset'),
                'network' => config('ai-billing.crypto_network'),
                'walletAddress' => config('ai-billing.crypto_wallet_address'),
                'scannerBaseUrl' => config('ai-billing.crypto_scanner_url'),
            ],
        ];
    }

    private function plan(AiBillingPlan $plan): array
    {
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'price' => $plan->monthly_price,
            'currency' => $plan->currency,
            'quota' => $plan->included_credits,
        ];
    }

    public function paymentRequest(AiBillingPaymentRequest $request): array
    {
        return [
            'id' => $request->id,
            'type' => $request->type,
            'status' => $request->status,
            'amount' => $request->amount,
            'currency' => $request->currency,
            'requestedAt' => $this->date($request->created_at),
            'notes' => $request->notes,
            'reference' => $request->reference,
            'plan' => $request->plan ? $this->plan($request->plan) : null,
            'crypto' => [
                'asset' => $request->crypto_asset,
                'network' => $request->crypto_network,
                'expectedAmount' => $request->expected_crypto_amount,
                'receivedAmount' => $request->received_crypto_amount,
                'walletAddress' => $request->wallet_address,
                'transactionHash' => $request->transaction_hash,
                'scannerUrl' => $this->scannerUrl($request->transaction_hash),
                'expiresAt' => $this->dateTime($request->expires_at),
            ],
            'provider' => [
                'name' => $request->provider,
                'paymentId' => $request->provider_payment_id,
                'prepayId' => $request->provider_prepay_id,
                'status' => $request->provider_status,
                'invoiceUrl' => $this->providerCheckoutUrl($request),
                'checkoutUrl' => $this->providerCheckoutUrl($request),
                'qrCodeUrl' => $this->qrCodeUrl($request),
                'debug' => [
                    'rawStatus' => data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.rawStatus',
                    ),
                    'message' => data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.message',
                    ),
                    'paymentId' => data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.paymentId',
                    ),
                    'invoiceId' => data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.invoiceId',
                    ),
                    'priceAmount' => data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.payload.price_amount',
                    ) ?: data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.payload.payments.0.price_amount',
                    ),
                    'priceCurrency' => data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.payload.price_currency',
                    ) ?: data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.payload.payments.0.price_currency',
                    ),
                    'lookupAttempts' => data_get(
                        $request->provider_payload,
                        'nowPaymentsVerification.payload.nowPaymentsLookup.attempts',
                        [],
                    ),
                ],
            ],
        ];
    }

    public function paymentHistory(
        AiBillingAccount $account,
        int $limit = 100,
    ): array {
        return $account
            ->paymentRequests()
            ->with('plan')
            ->whereIn('status', ['paid', 'rejected', 'cancelled'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(
                fn(AiBillingPaymentRequest $request) => $this->paymentRequest(
                    $request,
                ),
            )
            ->values()
            ->all();
    }

    private function qrCodeUrl(AiBillingPaymentRequest $request): ?string
    {
        if ($request->provider === 'tron_self_custody') {
            return $this->selfCustodyQrCodeUrl($request);
        }

        $payload = $request->provider_payload ?: [];

        return Arr::get($payload, 'data.qrcodeLink')
            ?: Arr::get($payload, 'data.qrCodeUrl')
            ?: Arr::get($payload, 'data.qrcodeUrl')
            ?: Arr::get($payload, 'data.qrContent')
            ?: Arr::get($payload, 'nowPaymentsInvoice.qrcodeLink')
            ?: Arr::get($payload, 'nowPaymentsInvoice.qrCodeUrl')
            ?: Arr::get($payload, 'nowPaymentsInvoice.qrcodeUrl')
            ?: Arr::get($payload, 'nowPaymentsVerification.qrcodeLink')
            ?: Arr::get($payload, 'nowPaymentsVerification.qrCodeUrl')
            ?: Arr::get($payload, 'nowPaymentsVerification.qrcodeUrl')
            ?: Arr::get($payload, 'qrcodeLink')
            ?: Arr::get($payload, 'qrCodeUrl')
            ?: Arr::get($payload, 'qrcodeUrl');
    }

    private function providerCheckoutUrl(
        AiBillingPaymentRequest $request,
    ): ?string {
        if ($request->provider_checkout_url || $request->provider_invoice_url) {
            return $request->provider_checkout_url ?: $request->provider_invoice_url;
        }

        if ($request->provider === 'nowpayments' && $request->provider_prepay_id) {
            return str_replace(
                '{id}',
                rawurlencode((string) $request->provider_prepay_id),
                config(
                    'ai-billing.nowpayments.checkout_url_template',
                    'https://nowpayments.io/payment/?iid={id}',
                ),
            );
        }

        return null;
    }

    private function selfCustodyQrCodeUrl(
        AiBillingPaymentRequest $request,
    ): ?string {
        if (!$request->wallet_address) {
            return null;
        }

        $size = (int) config('ai-billing.tron.request_qr_size', 180);

        return sprintf(
            'https://api.qrserver.com/v1/create-qr-code/?size=%1$dx%1$d&data=%2$s',
            $size,
            rawurlencode($request->wallet_address),
        );
    }

    private function scannerUrl(?string $transactionHash): ?string
    {
        if (!$transactionHash) {
            return null;
        }

        return str_replace(
            '{hash}',
            $transactionHash,
            config('ai-billing.crypto_scanner_url'),
        );
    }

    private function alerts(int $monthlyUsed, int $quota): array
    {
        $percent = $quota > 0 ? $monthlyUsed / $quota : 0;
        $alerts = [];

        if ($percent >= 1) {
            $alerts[] = [
                'tone' => 'critical',
                'title' => 'Monthly quota reached',
                'message' =>
                    'AI replies will use valid top-up credits. If no top-up remains, AI replies stop immediately.',
            ];
        } elseif ($percent >= 0.8) {
            $alerts[] = [
                'tone' => 'warning',
                'title' => 'Usage is approaching the monthly quota',
                'message' =>
                    'Top-up credits will be used only after monthly credits run out.',
            ];
        }

        $alerts[] = [
            'tone' => 'info',
            'title' => 'Crypto payment confirmation is enabled',
            'message' =>
                'Upgrade and top-up requests activate after the crypto payment is verified.',
        ];

        return $alerts;
    }

    private function date(?CarbonInterface $date): ?string
    {
        return $date?->toDateString();
    }

    private function dateTime(?CarbonInterface $date): ?string
    {
        return $date?->toIso8601String();
    }
}
