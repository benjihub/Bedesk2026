<?php

namespace App\Conversations\Events;

use App\Conversations\Models\Conversation;
use App\Core\HelpDeskChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Conversation $conversation)
    {
        $this->dontBroadcastToCurrentUser();
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel(HelpDeskChannel::NAME)];
    }

    public function broadcastAs(): string
    {
        return HelpDeskChannel::EVENT_CONVERSATIONS_CREATED;
    }

    public function broadcastWhen(): bool
    {
        return $this->conversation->isNormalMode();
    }

    public function broadcastWith(): array
    {
        return [
            'event' => $this->broadcastAs(),
            'conversations' => [
                [
                    'id' => $this->conversation->id,
                    'status_category' => $this->conversation->status_category,
                    'assignee_id' => $this->conversation->assignee_id,
                    'assigned_to' => $this->conversation->assigned_to,
                    'group_id' => $this->conversation->group_id,
                    'type' => $this->conversation->type,
                    'last_message_id' => $this->conversation->last_message_id,
                    'closed_by' => $this->conversation->closed_by,
                    'closed_at' => $this->conversation->closed_at,
                    'user_id' => $this->conversation->user_id,
                    'updated_at' => $this->conversation->updated_at,
                    'created_at' => $this->conversation->created_at,
                ],
            ],
        ];
    }
}
