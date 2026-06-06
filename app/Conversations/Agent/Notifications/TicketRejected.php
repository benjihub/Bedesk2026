<?php

namespace App\Conversations\Agent\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(mixed $notifiable)
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable)
    {
        $siteName = config('app.name');
        return (new MailMessage())
            ->subject(__(':siteName support', ['siteName' => $siteName]))
            ->line(__('Please create new tickets via our support site.'))
            ->action(__('Create Ticket'), url('/hc/tickets/new'));
    }
}
