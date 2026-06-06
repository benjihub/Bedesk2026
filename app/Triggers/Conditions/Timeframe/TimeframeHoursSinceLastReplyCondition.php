<?php

namespace App\Triggers\Conditions\Timeframe;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;
use Carbon\Carbon;

class TimeframeHoursSinceLastReplyCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        $lastReply = $conversation->latestMessage;
        $hours = (int) $conditionValue;
        return $lastReply?->created_at->lte(Carbon::now()->subHours($hours));
    }
}
