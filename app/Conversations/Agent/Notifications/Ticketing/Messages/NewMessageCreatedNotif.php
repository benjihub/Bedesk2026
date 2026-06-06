<?php

namespace App\Conversations\Agent\Notifications\Ticketing\Messages;

use App\Conversations\Agent\Notifications\Ticketing\BaseConversationNotification;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Core\UrlGenerator;
use App\Models\User;
use Illuminate\Support\Str;

abstract class NewMessageCreatedNotif extends BaseConversationNotification
{
    public function __construct(
        protected Conversation $conversation,
        protected ConversationItem $message,
    ) {}

    protected function mainAction(): array
    {
        return [
            'label' => __('View Conversation'),
            'action' => app(UrlGenerator::class)->conversation(
                $this->conversation,
            ),
        ];
    }

    protected function lines(User $notifiable): array
    {
        return [
            $this->firstLine($notifiable),
            Str::limit(
                strip_tags(str_replace('&nbsp;', '', $this->message->body)),
                150,
            ),
        ];
    }

    protected function firstLine(User $notifiable): string
    {
        $vars = [
            'user' => $this->message->user->name,
            'assignee' => $this->conversation->assignee_id
                ? $this->conversation->assignee->name
                : null,
            'ticketId' => $this->conversation->id,
        ];

        if ($this->conversation->assignee_id === $notifiable->id) {
            return $this->message->type === ConversationItem::NOTE_TYPE
                ? __(
                    '**:user** added a note to your conversation #:ticketId',
                    $vars,
                )
                : __(
                    '**:user** replied to your conversation #:ticketId',
                    $vars,
                );
        } elseif ($this->conversation->assignee_id) {
            return $this->message->type === ConversationItem::NOTE_TYPE
                ? __(
                    '**:user** added a note to **:assignee** conversation #:ticketId',
                    $vars,
                )
                : __(
                    '**:user** replied to **:assignee** conversation #:ticketId',
                    $vars,
                );
        } else {
            return $this->message->type === ConversationItem::NOTE_TYPE
                ? __(
                    '**:user** added a note to unassigned conversation #:ticketId',
                    $vars,
                )
                : __(
                    '**:user** replied to unassigned conversation #:ticketId',
                    $vars,
                );
        }
    }

    protected function image(): string|null
    {
        return $this->conversation->user->image;
    }
}
