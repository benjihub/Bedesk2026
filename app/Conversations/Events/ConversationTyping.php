<?php

namespace App\Conversations\Events;

use App\Conversations\Models\Conversation;
use App\Core\HelpDeskChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class ConversationTyping implements ShouldBroadcastNow
{
    use InteractsWithSockets;

    public function __construct(
        public Conversation $conversation,
        public string $author,
        public bool $isTyping,
    ) {
        $this->dontBroadcastToCurrentUser();
    }

    public function broadcastOn()
    {
        return [new PresenceChannel(HelpDeskChannel::NAME)];
    }

    public function broadcastAs(): string
    {
        return HelpDeskChannel::EVENT_CONVERSATIONS_TYPING;
    }

    public function broadcastWhen(): bool
    {
        return $this->conversation->isNormalMode();
    }

    public function broadcastWith(): array
    {
        return [
            'event' => $this->broadcastAs(),
            'conversationId' => $this->conversation->id,
            'author' => $this->author,
            'isTyping' => $this->isTyping,
            'conversations' => [
                [
                    'id' => $this->conversation->id,
                    'type' => $this->conversation->type,
                    'status_category' => $this->conversation->status_category,
                    'assignee_id' => $this->conversation->assignee_id,
                    'assigned_to' => $this->conversation->assigned_to,
                    'group_id' => $this->conversation->group_id,
                    'closed_by' => $this->conversation->closed_by,
                    'closed_at' => $this->conversation->closed_at,
                    'user_id' => $this->conversation->user_id,
                ],
            ],
        ];
    }
}
