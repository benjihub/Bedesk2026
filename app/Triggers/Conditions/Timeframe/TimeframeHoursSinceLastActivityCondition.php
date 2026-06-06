<?php

namespace App\Triggers\Conditions\Timeframe;

use App\Conversations\Models\Conversation;
use App\Triggers\Conditions\BaseCondition;
use Carbon\Carbon;

class TimeframeHoursSinceLastActivityCondition extends BaseCondition
{
    public function isMet(
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate,
        string $operatorName,
        mixed $conditionValue,
    ): bool {
        $hours = (int) $conditionValue;
        return $conversation->updated_at->lte(Carbon::now()->subHours($hours));
    }
}
