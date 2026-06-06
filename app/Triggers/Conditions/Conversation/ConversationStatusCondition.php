<?php namespace App\Triggers\Conditions\Conversation;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;

class ConversationStatusCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        return match ($operatorName) {
            'is' => $this->comparator->compare(
                $conversation->status_id,
                $conditionValue,
                'equals',
            ),
            'not' => $this->comparator->compare(
                $conversation->status_id,
                $conditionValue,
                'not_equals',
            ),
            'changed' => $this->statusChanged(
                $conversation,
                $conversationDataBeforeUpdate,
            ),
            'not_changed' => !$this->statusChanged(
                $conversation,
                $conversationDataBeforeUpdate,
            ),
            'changed_to' => $this->statusChanged(
                $conversation,
                $conversationDataBeforeUpdate,
            ) &&
                $this->comparator->compare(
                    $conversation->status_id,
                    $conditionValue,
                    'equals',
                ),
            'not_changed_to' => $this->statusChanged(
                $conversation,
                $conversationDataBeforeUpdate,
            ) &&
                $this->comparator->compare(
                    $conversation->status_id,
                    $conditionValue,
                    'not_equals',
                ),
            'changed_from' => $this->statusChanged(
                $conversation,
                $conversationDataBeforeUpdate,
            ) &&
                $this->comparator->compare(
                    $conversationDataBeforeUpdate['status_id'] ?? null,
                    $conditionValue,
                    'equals',
                ),
            'not_changed_from' => $this->statusChanged(
                $conversation,
                $conversationDataBeforeUpdate,
            ) &&
                $this->comparator->compare(
                    $conversationDataBeforeUpdate['status_id'] ?? null,
                    $conditionValue,
                    'not_equals',
                ),
            default => false,
        };
    }

    protected function statusChanged(
        Conversation $updatedTicket,
        array|null $conversationDataBeforeUpdate,
    ): bool {
        return !is_null($conversationDataBeforeUpdate) &&
            $this->comparator->compare(
                $updatedTicket->status_id,
                $conversationDataBeforeUpdate['status_id'],
                'not_equals',
            );
    }
}
