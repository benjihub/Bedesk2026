<?php namespace App\Triggers\Actions;

use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;

class AssignConversationToAgentAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $agentId = $action['value']['agent_id'];

        if ($conversation->assignee_id == $agentId) {
            return $conversation;
        }

        return ConversationsAssigner::assignConversationsToAgent(
            [$conversation],
            $agentId,
            addEvent: true,
        )->first();
    }
}
