<?php

namespace App\Conversations\Agent\Notifications\Ticketing;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Slack\SlackMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ActionsBlock;

abstract class BaseConversationNotification extends Notification implements
    ShouldQueue
{
    use Queueable;

    /**
     * Provided by extending class.
     */
    public const NOTIF_ID = null;

    abstract protected function mainAction(): array;
    abstract protected function image(): string|null;
    abstract protected function lines(User $notifiable): array;

    public function via(User $notifiable): array
    {
        $channels = [];

        if (
            $sub = $notifiable->notificationSubscriptions
                ->where('notif_id', static::NOTIF_ID)
                ->first()
        ) {
            foreach (array_filter($sub->channels) as $channel => $isSelected) {
                if ($channel === 'browser') {
                    $channels = array_merge($channels, [
                        'database',
                        'broadcast',
                    ]);
                } elseif ($channel === 'email') {
                    $channels[] = 'mail';
                } else {
                    $channels[] = $channel;
                }
            }
        }

        return $channels;
    }

    public function toMail(User $notifiable): MailMessage
    {
        $mainAction = $this->mainAction();
        $subject = method_exists($this, 'subject')
            ? $this->subject()
            : strip_tags(str_replace('**', '', $this->lines($notifiable)[0]));
        $msg = (new MailMessage())->subject($subject);

        foreach ($this->lines($notifiable) as $line) {
            $msg->line($line);
        }

        return $msg->action($mainAction['label'], $mainAction['action']);
    }

    public function toSlack(User $notifiable): SlackMessage
    {
        return (new SlackMessage())
            ->when($this->image(), function (SlackMessage $message) {
                $message->image($this->image());
            })
            ->text(strip_tags($this->lines($notifiable)[0]))
            ->actionsBlock(function (ActionsBlock $actions) use ($notifiable) {
                $mainAction = $this->mainAction();
                $actions
                    ->button($mainAction['label'])
                    ->url($mainAction['action']);
            });
    }

    public function toArray(User $notifiable): array
    {
        return [
            'image' => $this->image(),
            'mainAction' => $this->mainAction(),
            'lines' => array_map(
                fn($line) => ['content' => $line],
                $this->lines($notifiable),
            ),
        ];
    }
}
