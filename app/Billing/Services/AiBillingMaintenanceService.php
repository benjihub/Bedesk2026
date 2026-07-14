<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingTopUp;

class AiBillingMaintenanceService
{
    public function __construct(
        private AiBillingPaymentRequestService $paymentRequests,
    ) {
    }

    public function reconcilePendingPayments(): int
    {
        $verified = 0;

        AiBillingPaymentRequest::query()
            ->with('plan')
            ->where('status', 'pending')
            ->where('provider', config('ai-billing.payment_provider', 'nowpayments'))
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderBy('id')
            ->limit((int) config('ai-billing.payment_reconcile_limit', 50))
            ->get()
            ->each(function (AiBillingPaymentRequest $paymentRequest) use (&$verified) {
                $result = $this->paymentRequests->reconcilePayment(
                    $paymentRequest,
                );

                if ($result->status === 'paid') {
                    $verified++;
                }
            });

        return $verified;
    }

    public function expirePaymentRequests(): int
    {
        return AiBillingPaymentRequest::query()
            ->where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update([
                'status' => 'cancelled',
                'provider_status' => 'expired',
                'expired_at' => now(),
                'notes' => 'Payment request expired after 24 hours',
            ]);
    }

    public function expireTopUps(): int
    {
        return AiBillingTopUp::query()
            ->whereIn('status', ['active', 'in_use'])
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update([
                'status' => 'expired',
            ]);
    }

    public function run(): array
    {
        return [
            'verifiedPaymentRequests' => $this->reconcilePendingPayments(),
            'expiredPaymentRequests' => $this->expirePaymentRequests(),
            'expiredTopUps' => $this->expireTopUps(),
        ];
    }
}
