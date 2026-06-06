<?php

namespace App\Conversations\Agent\Notifications\Ticketing;

use App\Conversations\Models\Conversation;
use App\Core\UrlGenerator;
use App\Models\User;
use Illuminate\Support\Str;

class ConversationCreatedNotif extends BaseConversationNotification
{
    public const NOTIF_ID = '01';

    public function __construct(protected Conversation $conversation) {}

    protected function lines(User $notifiable): array
    {
        $lines = [$this->firstLine()];

        if ($this->conversation->subject) {
            $lines[] = __('Subject: :subject', [
                'subject' => $this->conversation->subject,
            ]);
        }

        $lines[] = Str::limit(
            strip_tags($this->conversation->latestMessage->body),
            150,
        );

        return $lines;
    }

    protected function firstLine(): string
    {
        return __(':customer has started a new conversion #:conversationId', [
            'customer' => $this->conversation->user->name,
            'conversationId' => $this->conversation->id,
        ]);
    }

    protected function image(): string|null
    {
        return $this->conversation->user->image;
    }

    protected function mainAction(): array
    {
        return [
            'label' => __('View conversation'),
            'action' => app(UrlGenerator::class)->conversation(
                $this->conversation,
            ),
        ];
    }
}
