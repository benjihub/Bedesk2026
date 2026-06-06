<?php

namespace App\Conversations\Actions;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Models\TicketEventLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class TicketEventLogger
{
    public function log(
        Conversation $conversation,
        string $type,
        User|Model|null $actor = null,
        string|null $actorType = null,
        array $metadata = [],
        Carbon|string|null $createdAt = null,
    ): TicketEventLog|null {
        if ($conversation->type !== 'ticket') {
            return null;
        }

        return TicketEventLog::create([
            'conversation_id' => $conversation->id,
            'event_type' => $type,
            'actor_type' => $actorType ?? $this->resolveActorType($actor),
            'actor_id' => $actor?->getKey(),
            'metadata' => $this->normalizeMetadata($conversation, $metadata),
            'created_at' => $createdAt ?? now(),
        ]);
    }

    public function logCreated(Conversation $conversation): TicketEventLog|null
    {
        $actor = Auth::user();

        if (!$actor && $conversation->user_id) {
            $actor = $conversation->user;
        }

        return $this->log(
            conversation: $conversation,
            type: TicketEventLog::EVENT_CREATED,
            actor: $actor,
            actorType: $actor?->isAgent() ? 'human' : 'customer',
            metadata: [
                'channel' => $conversation->channel,
                'group_id' => $conversation->group_id,
                'requester_id' => $conversation->user_id,
            ],
            createdAt: $conversation->created_at,
        );
    }

    public function logAssigned(
        Conversation $conversation,
        int|null $oldAssigneeId,
        int|null $newAssigneeId,
    ): TicketEventLog|null {
        if ($oldAssigneeId === $newAssigneeId || !$newAssigneeId) {
            return null;
        }

        return $this->log(
            conversation: $conversation,
            type: TicketEventLog::EVENT_ASSIGNED,
            actor: User::find($newAssigneeId),
            actorType: 'human',
            metadata: [
                'old_assignee_id' => $oldAssigneeId,
                'new_assignee_id' => $newAssigneeId,
            ],
            createdAt: $conversation->assigned_at,
        );
    }

    public function logFirstReply(
        Conversation $conversation,
        ConversationItem $message,
    ): TicketEventLog|null {
        if (
            $message->type !== 'message' ||
            $message->author !== Conversation::AUTHOR_AGENT
        ) {
            return null;
        }

        $alreadyLogged = TicketEventLog::query()
            ->where('conversation_id', $conversation->id)
            ->where('event_type', TicketEventLog::EVENT_FIRST_REPLY)
            ->exists();

        if ($alreadyLogged) {
            return null;
        }

        return $this->log(
            conversation: $conversation,
            type: TicketEventLog::EVENT_FIRST_REPLY,
            actor: $message->user,
            actorType: 'human',
            metadata: [
                'message_id' => $message->id,
            ],
            createdAt: $message->created_at,
        );
    }

    public function logNeedHumanSupport(
        Conversation $conversation,
        User|Model|null $actor = null,
        array $metadata = [],
        Carbon|string|null $createdAt = null,
    ): TicketEventLog|null {
        $alreadyLogged = TicketEventLog::query()
            ->where('conversation_id', $conversation->id)
            ->where('event_type', TicketEventLog::EVENT_NEED_HUMAN_SUPPORT)
            ->exists();

        if ($alreadyLogged) {
            return null;
        }

        return $this->log(
            conversation: $conversation,
            type: TicketEventLog::EVENT_NEED_HUMAN_SUPPORT,
            actor: $actor,
            actorType: $actor?->isAgent() ? 'human' : 'system',
            metadata: $metadata,
            createdAt: $createdAt,
        );
    }

    public function logClosed(
        Conversation $conversation,
        int|null $previousStatus,
        int|null $newStatus,
    ): TicketEventLog|null {
        if ($this->latestOpenStateEvent($conversation) === TicketEventLog::EVENT_CLOSED) {
            return null;
        }

        return $this->log(
            conversation: $conversation,
            type: TicketEventLog::EVENT_CLOSED,
            actor: $conversation->closedBy ?? Auth::user(),
            actorType: $conversation->closed_by ? 'human' : 'system',
            metadata: [
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
            ],
            createdAt: $conversation->closed_at,
        );
    }

    public function logReopened(
        Conversation $conversation,
        int|null $previousStatus,
        int|null $newStatus,
    ): TicketEventLog|null {
        if ($this->latestOpenStateEvent($conversation) === TicketEventLog::EVENT_REOPENED) {
            return null;
        }

        return $this->log(
            conversation: $conversation,
            type: TicketEventLog::EVENT_REOPENED,
            actor: Auth::user(),
            actorType: Auth::user()?->isAgent() ? 'human' : 'system',
            metadata: [
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
            ],
        );
    }

    protected function normalizeMetadata(
        Conversation $conversation,
        array $metadata,
    ): array {
        return array_filter(
            [
                'group_id' => $conversation->group_id,
                ...$metadata,
            ],
            fn($value) => $value !== null,
        );
    }

    protected function resolveActorType(User|Model|null $actor): string|null
    {
        if (!$actor) {
            return 'system';
        }

        return method_exists($actor, 'isAgent') && $actor->isAgent()
            ? 'human'
            : 'customer';
    }

    protected function latestOpenStateEvent(Conversation $conversation): string|null
    {
        return TicketEventLog::query()
            ->where('conversation_id', $conversation->id)
            ->whereIn('event_type', [
                TicketEventLog::EVENT_CLOSED,
                TicketEventLog::EVENT_REOPENED,
            ])
            ->latest('created_at')
            ->latest('id')
            ->value('event_type');
    }
}
