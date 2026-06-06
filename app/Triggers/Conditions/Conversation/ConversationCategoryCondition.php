<?php namespace App\Triggers\Conditions\Conversation;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;

class ConversationCategoryCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        $categoryAttribute = $conversation
            ->customAttributes()
            ->where('key', 'category')
            ->first();

        if (!$categoryAttribute) {
            return false;
        }

        return $this->comparator->compare(
            $categoryAttribute->value,
            $conditionValue,
            $operatorName,
        );
    }
}
