<?php namespace App\Conversations\Events;

use App\Conversations\Models\Conversation;
use App\Core\HelpDeskChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\Factory as BroadcastFactory;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class ConversationsUpdated
{
    use InteractsWithSockets;

    protected static bool $dispatchingPaused = false;

    protected static array $dispatchedEvents = [];

    public array|Collection $conversationsDataBeforeUpdate = [];
    public array|Collection $conversationsAfterUpdate;

    public function __construct(array|Collection $conversationsBeforeUpdate)
    {
        $this->dontBroadcastToCurrentUser();

        $this->conversationsDataBeforeUpdate = [];
        foreach ($conversationsBeforeUpdate as $conversation) {
            $this->conversationsDataBeforeUpdate[
                $conversation->id
            ] = $this->conversationToCompactArray($conversation);
        }
    }

    public static function pauseDispatching(): void
    {
        self::$dispatchingPaused = true;
    }

    public static function resumeDispatching(): void
    {
        self::$dispatchingPaused = false;
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel(HelpDeskChannel::NAME)];
    }

    public function broadcastAs(): string
    {
        return HelpDeskChannel::EVENT_CONVERSATIONS_UPDATED;
    }

    public function broadcastWhen(): bool
    {
        foreach ($this->conversationsAfterUpdate as $conversation) {
            if (!$conversation->isNormalMode()) {
                return false;
            }
        }

        return true;
    }

    public function broadcastWith(): array
    {
        return [
            'event' => $this->broadcastAs(),
            'conversations' => array_map(
                fn($c) => $this->conversationToCompactArray($c),
                is_array($this->conversationsAfterUpdate)
                    ? $this->conversationsAfterUpdate
                    : $this->conversationsAfterUpdate->all(),
            ),
        ];
    }

    public function dispatch(array|Collection $conversations): void
    {
        $this->conversationsAfterUpdate = $conversations;

        if (empty($conversations) || !$this->broadcastWhen()) {
            return;
        }

        if (!self::$dispatchingPaused) {
            event($this);

            self::$dispatchedEvents[] = $this;
        }
    }

    /**
     * This class will log all ConversationsUpdated events dispatched during application lifecycle.
     * This method can be used to broadcast only one event with beforeData from first event and afterData from last event before application terminates. This is done because dozens of ConversationsUpdated events might be fired in some commands at nearly the same time, which can use issues when broadcasting them all.
     */
    public static function broadcastLatest(): void
    {
        if (!empty(self::$dispatchedEvents)) {
            $before = [];
            $after = [];

            foreach (self::$dispatchedEvents as $event) {
                // set before data for each conversation from the earliest event
                foreach ($event->conversationsDataBeforeUpdate as $data) {
                    if (!isset($before[$data['id']])) {
                        $before[$data['id']] = $data;
                    }
                }

                // set after data for each conversation from the latest event
                foreach ($event->conversationsAfterUpdate as $conversation) {
                    $after[$conversation['id']] = $conversation;
                }
            }

            $lastEvent = Arr::last(self::$dispatchedEvents);
            $lastEvent->conversationsDataBeforeUpdate = array_values($before);
            $lastEvent->conversationsAfterUpdate = array_values($after);
            app(BroadcastFactory::class)->queue($lastEvent);
        }
    }

    protected function conversationToCompactArray(
        Conversation $conversation,
    ): array {
        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'status_category' => $conversation->status_category,
            'assignee_id' => $conversation->assignee_id,
            'assigned_to' => $conversation->assigned_to,
            'last_message_id' => $conversation->last_message_id,
            'group_id' => $conversation->group_id,
            'closed_by' => $conversation->closed_by,
            'closed_at' => $conversation->closed_at,
            'user_id' => $conversation->user_id,
            'updated_at' => $conversation->updated_at,
            'created_at' => $conversation->created_at,
        ];
    }
}
