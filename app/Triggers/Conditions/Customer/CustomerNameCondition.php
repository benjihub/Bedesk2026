<?php namespace App\Triggers\Conditions\Customer;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;

class CustomerNameCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        return $this->comparator->compare(
            $conversation->user?->name,
            $conditionValue,
            $operatorName,
        );
    }
}
