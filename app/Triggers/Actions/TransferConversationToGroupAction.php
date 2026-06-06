<?php namespace App\Triggers\Actions;

use App\Conversations\Agent\Actions\AssignConversationsToGroup;
use App\Conversations\Models\Conversation;
use App\Team\Models\Group;
use App\Triggers\Models\Trigger;

class TransferConversationToGroupAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $groupId = $action['value']['group_id'];
        $group = Group::find($groupId);

        if ($group && $conversation->group_id !== $group->id) {
            return (new AssignConversationsToGroup())
                ->execute([$conversation->id], $group, addEvent: true)
                ->first();
        }

        return $conversation;
    }
}
