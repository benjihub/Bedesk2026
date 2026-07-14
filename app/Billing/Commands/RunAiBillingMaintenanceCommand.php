<?php

namespace App\Billing\Commands;

use App\Billing\Services\AiBillingMaintenanceService;
use Illuminate\Console\Command;

class RunAiBillingMaintenanceCommand extends Command
{
    protected $signature = 'billing:maintenance';
    protected $description = 'Scan billing payments and expire stale payment requests/top-ups.';

    public function handle(AiBillingMaintenanceService $maintenance): int
    {
        $result = $maintenance->run();

        $this->info(
            sprintf(
                'Verified %d payment request(s), expired %d payment request(s) and %d top-up(s).',
                $result['verifiedPaymentRequests'],
                $result['expiredPaymentRequests'],
                $result['expiredTopUps'],
            ),
        );

        return self::SUCCESS;
    }
}
