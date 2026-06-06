<?php

namespace App\Conversations\Events;

use App\Core\HelpDeskChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class ConversationsAssignedToAgent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Collection $conversations)
    {
        $this->dontBroadcastToCurrentUser();
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel(HelpDeskChannel::NAME)];
    }

    public function broadcastAs(): string
    {
        return HelpDeskChannel::EVENT_AGENTS_UPDATED;
    }

    public function broadcastWhen(): bool
    {
        return $this->conversations->every(fn($c) => $c->isNormalMode());
    }

    public function broadcastWith(): array
    {
        return [
            'event' => $this->broadcastAs(),
            'agentId' => $this->conversations->first(fn($c) => $c->assignee_id)
                ?->assignee_id,
        ];
    }
}
