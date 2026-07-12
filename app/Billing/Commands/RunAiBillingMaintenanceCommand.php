<?php

namespace App\Billing\Commands;

use App\Billing\Services\AiBillingMaintenanceService;
use Illuminate\Console\Command;

class RunAiBillingMaintenanceCommand extends Command
{
    protected $signature = 'billing:maintenance';
    protected $description = 'Expire stale billing payment requests and top-ups.';

    public function handle(AiBillingMaintenanceService $maintenance): int
    {
        $result = $maintenance->run();

        $this->info(
            sprintf(
                'Expired %d payment request(s) and %d top-up(s).',
                $result['expiredPaymentRequests'],
                $result['expiredTopUps'],
            ),
        );

        return self::SUCCESS;
    }
}
