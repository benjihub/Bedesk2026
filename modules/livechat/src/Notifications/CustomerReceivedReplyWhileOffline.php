<?php

namespace Livechat\Notifications;

use App\Conversations\Models\ConversationItem;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\HtmlString;

class CustomerReceivedReplyWhileOffline extends Notification implements
    ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $agent,
        public ConversationItem $message,
        public string $lastUrl,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $customer): MailMessage
    {
        $siteName = config('app.name');

        $url =
            (parse_url($this->lastUrl, PHP_URL_QUERY) ? '&' : '?') .
            'beConversationId=' .
            $this->message->conversation_id;

        return (new MailMessage())
            ->subject(
                __(':agent replied to your chat on :siteName', [
                    'agent' => $this->agent->name,
                    'siteName' => $siteName,
                ]),
            )
            ->greeting(__('Hello!'))
            ->line(
                __(':agent replied to your chat on :siteName', [
                    'agent' => $this->agent->name,
                    'siteName' => $siteName,
                ]),
            )
            ->line(new HtmlString($this->message->body))
            ->action(__('View chat'), $url);
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}
