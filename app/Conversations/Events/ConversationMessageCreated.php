<?php

namespace App\Conversations\Events;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Core\HelpDeskChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class ConversationMessageCreated implements ShouldBroadcastNow
{
    use InteractsWithSockets;

    public function __construct(
        public Conversation $conversation,
        public ConversationItem $message,
    ) {
        $this->dontBroadcastToCurrentUser();
    }

    public function broadcastOn()
    {
        return [new PresenceChannel(HelpDeskChannel::NAME)];
    }

    public function broadcastAs(): string
    {
        return HelpDeskChannel::EVENT_CONVERSATIONS_NEW_MESSAGE;
    }

    public function broadcastWhen(): bool
    {
        return $this->conversation->isNormalMode();
    }

    public function broadcastWith(): array
    {
        return [
            'event' => $this->broadcastAs(),
            'type' => $this->message->type,
            'conversationId' => $this->message->conversation_id,
            'messageId' => $this->message->id,
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
