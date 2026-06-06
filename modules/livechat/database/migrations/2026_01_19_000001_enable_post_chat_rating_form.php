<?php

use App\Attributes\Models\CustomAttribute;
use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        $setting = Setting::query()->where('name', 'chatWidget')->first();
        if (!$setting) {
            return;
        }

        $widget = $setting->value;
        if (!is_array($widget)) {
            return;
        }

        $ratingAttributeId = CustomAttribute::query()
            ->where('type', 'conversation')
            ->where('key', 'rating')
            ->value('id');

        if (!$ratingAttributeId) {
            return;
        }

        $forms = is_array($widget['forms'] ?? null) ? $widget['forms'] : [];
        $postChat = is_array($forms['postChat'] ?? null) ? $forms['postChat'] : [];

        $attributes = $postChat['attributes'] ?? [];
        if (!is_array($attributes)) {
            $attributes = [];
        }

        $attributes[] = $ratingAttributeId;

        $postChat['disabled'] = false;
        $postChat['attributes'] = array_values(array_unique($attributes));
        $postChat['information'] = $postChat['information'] ?? 'How was your chat?';

        $forms['postChat'] = $postChat;
        $widget['forms'] = $forms;

        $setting->value = $widget;
        $setting->save();
    }
};
