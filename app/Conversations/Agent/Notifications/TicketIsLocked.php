<?php

namespace App\Conversations\Agent\Notifications;

use App\Conversations\Models\Conversation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketIsLocked extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Conversation $conversation) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject(__('Ticket is locked'))
            ->line(
                __(
                    "Ticket you replied to ({$this->conversation->id}) was locked due to inactivity. Please create a new ticket on our support site.",
                ),
            )
            ->action(__('Create Ticket'), url('/hc/tickets/new'));
    }
}
