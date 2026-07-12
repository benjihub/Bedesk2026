<?php namespace App\Billing\Notifications;

use App\Billing\Models\AiBillingNotification;
use App\Models\User;
use Illuminate\Notifications\Notification;

class AiBillingEventNotification extends Notification
{
    public function __construct(
        private AiBillingNotification $billingNotification,
    ) {
    }

    public function via(User $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(User $notifiable): array
    {
        return [
            'image' => null,
            'mainAction' => [
                'label' => 'Open billing',
                'action' => url('/dashboard/billing'),
            ],
            'lines' => [
                ['content' => $this->billingNotification->title],
                ['content' => $this->billingNotification->message],
            ],
            'billing' => [
                'id' => $this->billingNotification->id,
                'event' => $this->billingNotification->event,
                'tone' => $this->billingNotification->tone,
                'accountId' =>
                    $this->billingNotification->billing_account_id,
                'data' => $this->billingNotification->data,
            ],
        ];
    }
}
