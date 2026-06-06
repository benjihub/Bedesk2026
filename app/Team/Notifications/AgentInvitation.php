<?php

namespace App\Team\Notifications;

use App\Team\Models\AgentInvite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AgentInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected string $inviterName,
        protected AgentInvite $agentInvite,
    ) {}

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $data = [
            'inviter' => ucfirst($this->inviterName),
            'siteName' => config('app.name'),
        ];

        $url = url("agents/join/{$this->agentInvite->id}");
        $email = urlencode($this->agentInvite->email);
        $url .= "?email={$email}";

        return (new MailMessage())
            ->subject(
                __(
                    ':inviter invited you to join your team on :siteName',
                    $data,
                ),
            )
            ->line(
                __(
                    ':inviter has invited you to work together on :siteName.',
                    $data,
                ),
            )
            ->action(__('Join your team'), $url)
            ->line(__('This invitation link will expire in 3 days.'))
            ->line(
                __(
                    'If you do not wish to join this team, no further action is required.',
                ),
            );
    }
}
