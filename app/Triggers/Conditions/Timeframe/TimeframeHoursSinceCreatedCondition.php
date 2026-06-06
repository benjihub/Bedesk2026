<?php

namespace App\Triggers\Conditions\Timeframe;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;
use Carbon\Carbon;

class TimeframeHoursSinceCreatedCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        $hours = (int) $conditionValue;
        return $conversation->created_at->lte(Carbon::now()->subHours($hours));
    }
}
