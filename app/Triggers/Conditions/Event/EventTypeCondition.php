<?php

namespace App\Triggers\Conditions\Event;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;

class EventTypeCondition extends BaseCondition
{
    /**
     * Check if conversation was created or updated.
     */
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        if ($operatorName === 'is') {
            if (
                $conditionValue === 'conversation_created' &&
                !$conversationDataBeforeUpdate
            ) {
                return true;
            } elseif (
                $conditionValue === 'conversation_updated' &&
                $conversationDataBeforeUpdate
            ) {
                return true;
            }
        } elseif ($operatorName === 'not') {
            if (
                $conditionValue === 'conversation_created' &&
                $conversationDataBeforeUpdate
            ) {
                return true;
            } elseif (
                $conditionValue === 'conversation_updated' &&
                !$conversationDataBeforeUpdate
            ) {
                return true;
            }
        }

        return false;
    }
}
