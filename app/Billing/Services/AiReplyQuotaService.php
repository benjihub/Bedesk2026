<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingSubscription;
use App\Billing\Models\AiBillingUsageLedger;
use Illuminate\Support\Facades\DB;

class AiReplyQuotaService
{
    public function __construct(
        private AiBillingNotificationService $notifications,
    ) {
    }

    public function canConsume(AiBillingAccount $account, int $credits = 1): bool
    {
        $subscription = $account->activeSubscription()->with('plan')->first();

        if (!$subscription) {
            return false;
        }

        $monthlyUsed = (int) $account
            ->usageLedger()
            ->where('subscription_id', $subscription->id)
            ->sum('credits');

        $monthlyRemaining = max(
            $subscription->plan->included_credits - $monthlyUsed,
            0,
        );

        if ($monthlyRemaining >= $credits) {
            return true;
        }

        $canUseTopUp = $this->validTopUpBalance($account) >= $credits;

        if (!$canUseTopUp) {
            $this->notifications->aiStoppedDueToExhaustedCredits($account);
        }

        return $canUseTopUp;
    }

    public function recordSuccessfulReply(
        AiBillingAccount $account,
        array $context = [],
        int $credits = 1,
    ): AiBillingUsageLedger {
        return DB::transaction(function () use ($account, $context, $credits) {
            $messageId = $context['message_id'] ?? null;
            if ($messageId) {
                $existing = AiBillingUsageLedger::query()
                    ->where('message_id', $messageId)
                    ->where('usage_type', 'ai_reply')
                    ->first();

                if ($existing) {
                    return $existing;
                }
            }

            $subscription = $account->activeSubscription()->with('plan')->first();

            $monthlyUsed = (int) $account
                ->usageLedger()
                ->where('subscription_id', $subscription->id)
                ->sum('credits');

            $monthlyRemaining = max(
                $subscription->plan->included_credits - $monthlyUsed,
                0,
            );

            if ($monthlyRemaining >= $credits) {
                $ledger = AiBillingUsageLedger::create([
                    'billing_account_id' => $account->id,
                    'subscription_id' => $subscription->id,
                    'usage_type' => 'ai_reply',
                    'credits' => $credits,
                    ...$context,
                ]);

                $this->notifyCrossedQuotaThresholds(
                    $account,
                    $subscription,
                    $monthlyUsed,
                    $monthlyUsed + $credits,
                );

                return $ledger;
            }

            $topUp = $account
                ->topUps()
                ->where('status', 'active')
                ->where(function ($query) {
                    $query
                        ->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->whereColumn('used_credits', '<', 'purchased_credits')
                ->orderBy('expires_at')
                ->lockForUpdate()
                ->first();

            if (!$topUp) {
                abort(402, 'AI reply quota reached.');
            }

            $topUp->increment('used_credits', $credits);

            return AiBillingUsageLedger::create([
                'billing_account_id' => $account->id,
                'subscription_id' => $subscription->id,
                'top_up_id' => $topUp->id,
                'usage_type' => 'ai_reply',
                'credits' => $credits,
                ...$context,
            ]);
        });
    }

    private function validTopUpBalance(AiBillingAccount $account): int
    {
        return (int) $account
            ->topUps()
            ->where('status', 'active')
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->sum(DB::raw('purchased_credits - used_credits'));
    }

    private function notifyCrossedQuotaThresholds(
        AiBillingAccount $account,
        AiBillingSubscription $subscription,
        int $previousUsed,
        int $currentUsed,
    ): void {
        $quota = (int) $subscription->plan->included_credits;

        if (!$quota) {
            return;
        }

        foreach ([80, 90, 100] as $threshold) {
            $thresholdCredits = (int) ceil($quota * ($threshold / 100));

            if (
                $previousUsed < $thresholdCredits &&
                $currentUsed >= $thresholdCredits
            ) {
                $this->notifications->quotaThresholdReached(
                    $account,
                    $subscription,
                    $threshold,
                    min($currentUsed, $quota),
                    $quota,
                );
            }
        }
    }
}
