<?php namespace App\Triggers\Conditions\Conversation;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Triggers\Conditions\BaseCondition;
use Illuminate\Support\Facades\DB;

class ConversationAttachmentsCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        $attachmentCount = DB::table('file_entry_models')
            ->where('model_type', ConversationItem::MODEL_TYPE)
            ->whereIn(
                'model_id',
                fn($query) => $query
                    ->from('conversation_items')
                    ->where(
                        'conversation_items.conversation_id',
                        $conversation->id,
                    )
                    ->select('id'),
            )
            ->count();

        return $this->comparator->compare(
            $attachmentCount,
            $conditionValue,
            $operatorName,
        );
    }
}
