<?php namespace App\Triggers\Conditions\Conversation;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;

class ConversationBodyCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        if (!$conversation->latestMessage) {
            return false;
        }

        return $this->comparator->compare(
            $conversation->latestMessage->body,
            $conditionValue,
            $operatorName,
        );
    }
}
