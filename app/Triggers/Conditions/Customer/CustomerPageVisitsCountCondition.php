<?php namespace App\Triggers\Conditions\Customer;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;
use App\Contacts\Models\PageVisit;

class CustomerPageVisitsCountCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        $count = PageVisit::where('user_id', $conversation->user_id)->count();

        return $this->comparator->compare(
            $count,
            $conditionValue,
            $operatorName,
        );
    }
}
