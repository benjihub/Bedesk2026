<?php

namespace App\Core;

class WidgetFlags
{
    public static function scopedHcCategoryId(): int|null
    {
        $id = request()->header('X-Scoped-Hc-Category-Id');
        return $id ? (int) $id : null;
    }

    public static function isAiAgentPreviewMode(): bool
    {
        return request()->header('X-Ai-Agent-Preview-Mode') === 'true';
    }

    public static function isLivechatWidget(): bool
    {
        return request()->header('X-Chat-Widget') === 'true' ||
            request()->get('_xChatWidget') === 'true' ||
            str_starts_with(request()->path(), 'lc/widget');
    }
}
