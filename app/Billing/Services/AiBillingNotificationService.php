<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingNotification;
use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingSubscription;
use App\Billing\Models\AiBillingTopUp;
use App\Billing\Notifications\AiBillingEventNotification;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;

class AiBillingNotificationService
{
    public function paymentCreated(
        AiBillingPaymentRequest $paymentRequest,
    ): void {
        $type = strtolower($paymentRequest->type);

        $this->record($paymentRequest->account, [
            'event' => 'payment_created',
            'tone' => 'info',
            'title' => 'Payment request created',
            'message' => sprintf(
                'A %s payment request for %s is waiting for payment confirmation.',
                $type,
                $this->money($paymentRequest->amount, $paymentRequest->currency),
            ),
            'data' => [
                'paymentRequestId' => $paymentRequest->id,
                'reference' => $paymentRequest->reference,
                'type' => $paymentRequest->type,
                'amount' => $paymentRequest->amount,
                'currency' => $paymentRequest->currency,
            ],
            'dedupe_key' => "payment_created:{$paymentRequest->id}",
        ]);
    }

    public function paymentConfirmed(
        AiBillingPaymentRequest $paymentRequest,
    ): void {
        $this->record($paymentRequest->account, [
            'event' => 'payment_confirmed',
            'tone' => 'success',
            'title' => 'Payment confirmed',
            'message' => sprintf(
                'Payment %s has been confirmed for %s.',
                $paymentRequest->reference,
                $this->money($paymentRequest->amount, $paymentRequest->currency),
            ),
            'data' => [
                'paymentRequestId' => $paymentRequest->id,
                'reference' => $paymentRequest->reference,
                'type' => $paymentRequest->type,
                'amount' => $paymentRequest->amount,
                'currency' => $paymentRequest->currency,
            ],
            'dedupe_key' => "payment_confirmed:{$paymentRequest->id}",
        ]);
    }

    public function topUpActivated(AiBillingTopUp $topUp): void
    {
        $this->record($topUp->account, [
            'event' => 'top_up_activated',
            'tone' => 'success',
            'title' => 'Top-up activated',
            'message' => sprintf(
                '%s AI Reply Credits are now available and expire on %s.',
                number_format($topUp->purchased_credits),
                $topUp->expires_at?->toFormattedDateString() ?? 'no expiry',
            ),
            'data' => [
                'topUpId' => $topUp->id,
                'paymentRequestId' => $topUp->payment_request_id,
                'credits' => $topUp->purchased_credits,
                'expiresAt' => $topUp->expires_at?->toIso8601String(),
            ],
            'dedupe_key' => "top_up_activated:{$topUp->id}",
        ]);
    }

    public function quotaThresholdReached(
        AiBillingAccount $account,
        AiBillingSubscription $subscription,
        int $threshold,
        int $usedCredits,
        int $quota,
    ): void {
        $tone = $threshold >= 100 ? 'critical' : 'warning';

        $this->record($account, [
            'event' => "quota_{$threshold}",
            'tone' => $tone,
            'title' => "AI quota {$threshold}% used",
            'message' => sprintf(
                '%s of %s monthly AI Reply Credits have been used.',
                number_format($usedCredits),
                number_format($quota),
            ),
            'data' => [
                'subscriptionId' => $subscription->id,
                'threshold' => $threshold,
                'usedCredits' => $usedCredits,
                'quota' => $quota,
            ],
            'dedupe_key' => "quota_{$threshold}:{$subscription->id}",
        ]);
    }

    public function aiStoppedDueToExhaustedCredits(
        AiBillingAccount $account,
    ): void {
        $this->record($account, [
            'event' => 'ai_stopped_exhausted',
            'tone' => 'critical',
            'title' => 'AI replies stopped',
            'message' =>
                'Monthly and valid top-up credits are exhausted. AI replies are blocked until a top-up or plan renewal adds credits.',
            'data' => [
                'date' => now()->toDateString(),
            ],
            'dedupe_key' =>
                "ai_stopped_exhausted:{$account->id}:".now()->toDateString(),
        ]);
    }

    private function record(
        AiBillingAccount $account,
        array $payload,
    ): ?AiBillingNotification {
        $dedupeKey = $payload['dedupe_key'] ?? null;

        if (
            $dedupeKey &&
            AiBillingNotification::where('dedupe_key', $dedupeKey)->exists()
        ) {
            return null;
        }

        $notification = $account->notifications()->create([
            ...$payload,
            'notified_at' => now(),
        ]);

        $recipients = $this->recipients($account);

        if ($recipients->isNotEmpty()) {
            Notification::send(
                $recipients,
                new AiBillingEventNotification($notification),
            );
        }

        return $notification;
    }

    private function recipients(AiBillingAccount $account): Collection
    {
        if ($account->owner_user_id) {
            return User::where('id', $account->owner_user_id)->get();
        }

        $users = User::where('type', 'admin')->get();

        if ($users->isNotEmpty()) {
            return $users;
        }

        $admin = User::findAdmin();

        return $admin ? new Collection([$admin]) : new Collection();
    }

    private function money(int $amount, string $currency): string
    {
        return trim($currency.' '.number_format($amount));
    }
}
