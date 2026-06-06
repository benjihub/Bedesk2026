<?php

namespace App\Conversations\Agent\Actions;

use App\Team\Models\GroupRotationState;
use App\Conversations\Actions\ConversationEventsCreator;
use App\Conversations\Events\ConversationsAssignedToAgent;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use App\Models\User;
use App\Team\Models\Group;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ConversationsAssigner
{
    public static function distributeUnassignedConversationsToAvailableAgents(
        bool $addEvent = false,
    ): Collection {
        $conversations = Conversation::query()
            ->whereNotClosed()
            ->whereAssignedToHuman()
            ->whereNull('assignee_id')
            ->with(['group', 'status'])
            ->oldest()
            ->limit(10)
            ->get();

        return $conversations->map(
            fn(
                Conversation $conversation,
            ) => static::assignConversationRoundRobin(
                conversation: $conversation,
                addEvent: $addEvent,
            ),
        );
    }

    public static function assignConversationsToAgent(
        iterable $conversations,
        int $agentId,
        bool $addEvent = false,
    ): Collection {
        $conversations = collect($conversations);

        $original =
            isset($conversations[0]) &&
            $conversations[0] instanceof Conversation
                ? $conversations
                : Conversation::whereIn('id', $conversations)->get();
        $updatedEvent = new ConversationsUpdated($original);
        $updated = $original;

        $conversationsNotAssignedToAgent = $original->filter(
            fn($conversation) => $conversation->assignee_id !== $agentId,
        );

        if ($conversationsNotAssignedToAgent->isNotEmpty()) {
            // if conversation is currently assigned to a group agent is not part of, unassign
            $agentGroupIds = DB::table('group_user')
                ->where('user_id', $agentId)
                ->pluck('group_id');
            $conversationsToUnassign = $conversationsNotAssignedToAgent->filter(
                fn($c) => !is_null($c->group_id) &&
                    !$agentGroupIds->contains($c->group_id),
            );
            if ($conversationsToUnassign->isNotEmpty()) {
                Conversation::whereIn(
                    'id',
                    $conversationsToUnassign->pluck('id'),
                )->update(['group_id' => null]);
            }

            // assign conversations to agent
            $ids = $conversationsNotAssignedToAgent->pluck('id');
            Conversation::whereIn('id', $ids)->update([
                'assigned_to' => Conversation::ASSIGNED_AGENT,
                'assignee_id' => $agentId,
                'assigned_at' => now(),
            ]);

            $updated = Conversation::whereIn('id', $ids)->get();

            if ($addEvent) {
                $newAgent = User::find($agentId);
                $updated->each(
                    fn(
                        Conversation $conversation,
                    ) => (new ConversationEventsCreator(
                        $conversation,
                    ))->agentChanged($newAgent),
                );
            }

            $updatedEvent->dispatch($updated);
        }

        event(new ConversationsAssignedToAgent($updated));

        return $updated;
    }


    public static function assignConversationToFirstAvailableAgent(
        Conversation $conversation,
        array|null $except = [],
        bool $addEvent = false,
    ): Conversation {
        return static::assignConversationRoundRobin(
            conversation: $conversation,
            addEvent: $addEvent,
            except: $except,
        );
    }

    public static function assignConversationRoundRobin(
        Conversation $conversation,
        bool $addEvent = false,
        array|null $except = [],
    ): Conversation {
        $group = $conversation->relationLoaded('group')
            ? $conversation->group
            : $conversation->group()->first();
        $group = $group ?? Group::findDefault();

        if (!$group) {
            return static::putConversationInQueue($conversation, addEvent: $addEvent);
        }

        if ($group->assignment_mode === 'manual') {
            return static::putConversationInQueue(
                $conversation,
                group: $group,
                addEvent: $addEvent,
            );
        }

        return DB::transaction(function () use (
            $conversation,
            $group,
            $except,
            $addEvent,
        ) {
            $lockedConversation = Conversation::query()
                ->whereKey($conversation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $state = GroupRotationState::getOrCreateLockedForGroup($group->id);
            $agents = $group
                ->users()
                ->whereAgent()
                ->with(['groups', 'agentSettings', 'latestUserSession'])
                ->withActiveAssignedConversationsCount()
                ->when(
                    $except,
                    fn($query) => $query->whereNotIn('users.id', array_values($except)),
                )
                ->get()
                ->values();

            if ($agents->isEmpty()) {
                return static::putConversationInQueue(
                    $lockedConversation,
                    group: $group,
                    addEvent: $addEvent,
                );
            }

            $agentCount = $agents->count();
            $startIndex = $state->current_agent_index % $agentCount;
            $selectedAgent = null;
            $selectedIndex = null;

            for ($offset = 0; $offset < $agentCount; $offset++) {
                $candidateIndex = ($startIndex + $offset) % $agentCount;
                $candidate = $agents[$candidateIndex];

                if (
                    !$candidate->acceptsConversations() ||
                    !$candidate->wasActiveRecently()
                ) {
                    continue;
                }

                $selectedAgent = $candidate;
                $selectedIndex = $candidateIndex;
                break;
            }

            if (!$selectedAgent) {
                return static::putConversationInQueue(
                    $lockedConversation,
                    group: $group,
                    addEvent: $addEvent,
                );
            }

            $state->update([
                'current_agent_index' => ($selectedIndex + 1) % $agentCount,
            ]);

            return static::assignConversationsToAgent(
                collect([$lockedConversation]),
                $selectedAgent->id,
                addEvent: $addEvent,
            )
                ->first()
                ->refresh();
        });
    }

    /**
     * Drain queued conversations in FIFO order. The limit is a per-run
     * throttle; per-agent capacity is controlled by agentSettings.
     */
    public static function drainQueueIfNeeded(?int $groupId = null): Collection
    {
        $query = Conversation::query()
            ->whereNotClosed()
            ->where('assigned_to', Conversation::ASSIGNED_AGENT)
            ->whereNull('assignee_id')
            ->oldest()
            ->limit(10);

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        $queuedConversations = $query->get();

        if ($queuedConversations->isEmpty()) {
            return collect([]);
        }

        $assigned = collect();

        $queuedConversations->each(function (Conversation $conversation) use (&$assigned) {
            $result = static::assignConversationRoundRobin($conversation, addEvent: true);
            if ($result->assignee_id) {
                $assigned->push($result);
            }
        });

        return $assigned;
    }

    protected static function putConversationInQueue(
        Conversation $conversation,
        ?Group $group = null,
        bool $addEvent = false,
    ): Conversation {
        $conversation->update([
            'assigned_to' => Conversation::ASSIGNED_AGENT,
            'assignee_id' => null,
            'assigned_at' => null,
            'group_id' => $group?->id ?? $conversation->group_id,
        ]);

        $conversation = $conversation->refresh();

        if ($addEvent) {
            (new ConversationEventsCreator($conversation))->addedToQueue();
        }

        return $conversation;
    }
}
