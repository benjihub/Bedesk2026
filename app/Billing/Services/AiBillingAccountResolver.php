<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingPlan;
use App\Billing\Models\AiBillingSubscription;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class AiBillingAccountResolver
{
    public function resolve(): AiBillingAccount
    {
        return DB::transaction(function () {
            $account = AiBillingAccount::query()
                ->whereNull('owner_user_id')
                ->first();

            if (!$account) {
                $account = AiBillingAccount::create([
                    'owner_user_id' => null,
                    'name' => 'Company Account',
                    'status' => 'good',
                ]);
            }

            $this->ensureActiveSubscription($account);

            return $account->fresh([
                'activeSubscription.plan',
                'topUps',
                'paymentRequests.plan',
            ]);
        });
    }

    private function ensureActiveSubscription(AiBillingAccount $account): void
    {
        if ($account->activeSubscription()->exists()) {
            return;
        }

        $plan = AiBillingPlan::where(
            'slug',
            config('ai-billing.default_plan_slug', 'premium'),
        )->first();

        $plan ??= AiBillingPlan::orderBy('sort_order')->firstOrFail();

        $cycleStart = CarbonImmutable::today();
        $renewalDate = $cycleStart->addMonthNoOverflow();

        AiBillingSubscription::create([
            'billing_account_id' => $account->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'cycle_start' => $cycleStart,
            'cycle_end' => $renewalDate->subDay(),
            'renewal_date' => $renewalDate,
            'activated_at' => now(),
        ]);
    }
}
