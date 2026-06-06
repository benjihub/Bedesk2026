<?php namespace App\Triggers\Conditions\Customer;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;
use App\Contacts\Models\PageVisit;

class CustomerVisitedUrlCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        $urls = PageVisit::where('user_id', $conversation->user_id)
            ->limit(50)
            ->get()
            ->map(fn($visit) => $visit->url);

        return $urls->some(
            fn($url) => $this->comparator->compare(
                $url,
                $conditionValue,
                $operatorName,
            ),
        );
    }
}
