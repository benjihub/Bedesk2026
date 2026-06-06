<?php

namespace App\Conversations\Agent\Actions;

use App\Conversations\Actions\ConversationEventsCreator;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use App\Team\Models\Group;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AssignConversationsToGroup
{
    public function execute(
        mixed $conversationIds,
        Group $group,
        bool $addEvent = false,
    ): Collection {
        $original =
            isset($conversationIds[0]) &&
            $conversationIds[0] instanceof Conversation
                ? $conversationIds
                : Conversation::whereIn('id', $conversationIds)->get();
        $updatedEvent = new ConversationsUpdated($original);
        $updated = $original;

        $conversationsNotAssignedToGroup = $original->filter(
            fn($conversation) => $conversation->group_id !== $group->id,
        );

        if ($conversationsNotAssignedToGroup->isNotEmpty()) {
            // if conversation is currently assigned to agent not in the new group, unassign it
            $agentsInGroup = DB::table('group_user')
                ->where('group_id', $group->id)
                ->pluck('user_id');
            $conversationsToUnassign = $conversationsNotAssignedToGroup->filter(
                fn($c) => !is_null($c->assignee_id) &&
                    !$agentsInGroup->contains($c->assignee_id),
            );
            if ($conversationsToUnassign->isNotEmpty()) {
                Conversation::whereIn(
                    'id',
                    $conversationsToUnassign->pluck('id'),
                )->update(['assignee_id' => null, 'assigned_at' => now()]);
            }

            // assign conversations to group
            $ids = $conversationsNotAssignedToGroup->pluck('id');
            Conversation::whereIn('id', $ids)->update([
                'group_id' => $group->id,
            ]);
            $updated = Conversation::whereIn('id', $ids)->get();

            if ($addEvent) {
                $updated->each(
                    fn(
                        Conversation $conversation,
                    ) => (new ConversationEventsCreator(
                        $conversation,
                    ))->groupChanged($group),
                );
            }

            $updatedEvent->dispatch($updated);
        }

        return $updated;
    }
}
