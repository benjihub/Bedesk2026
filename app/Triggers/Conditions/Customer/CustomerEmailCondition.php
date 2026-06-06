<?php namespace App\Triggers\Conditions\Customer;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;

class CustomerEmailCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        if (!$conversation->user) {
            return false;
        }

        $emails = [
            $conversation->user->email,
            ...$conversation->user->secondaryEmails
                ->pluck('address')
                ->toArray(),
        ];

        foreach ($emails as $email) {
            if (
                $this->comparator->compare(
                    $email,
                    $conditionValue,
                    $operatorName,
                )
            ) {
                return true;
            }
        }

        return false;
    }
}
