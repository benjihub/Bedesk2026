<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingTopUp;

class AiBillingMaintenanceService
{
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
            'expiredPaymentRequests' => $this->expirePaymentRequests(),
            'expiredTopUps' => $this->expireTopUps(),
        ];
    }
}
