<?php namespace App\Triggers\Conditions;

use App\Conversations\Models\Conversation;

abstract class BaseCondition
{
    public function __construct(protected ValuesComparator $comparator) {}

    abstract public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool;
}
