<?php namespace App\Triggers\Conditions\Conversation;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;

class ConversationMailboxAddressCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        return $this->comparator->compare(
            $conversation->received_at_email,
            $conditionValue,
            $operatorName,
        );
    }
}
