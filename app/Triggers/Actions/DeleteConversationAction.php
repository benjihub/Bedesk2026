<?php namespace App\Triggers\Actions;

use App\Conversations\Agent\Actions\DeleteMultipleConversations;
use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;

class DeleteConversationAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        (new DeleteMultipleConversations())->execute([$conversation->id]);
        return $conversation;
    }
}
