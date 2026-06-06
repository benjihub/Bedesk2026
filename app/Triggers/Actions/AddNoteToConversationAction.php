<?php namespace App\Triggers\Actions;

use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;

class AddNoteToConversationAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $body = $action['value']['note_text'];

        (new CreateConversationMessage())->execute($conversation, [
            'body' => $body,
            'type' => 'note',
            'user_id' => $trigger->user_id,
            'author' => 'system',
        ]);

        return $conversation;
    }
}
