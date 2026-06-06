<?php

use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;

return new class extends Migration {
    public function up(): void
    {
        $this->renameDashboardSidebarLabels('Livechat', 'Widget', 'Shortcut');
    }

    public function down(): void
    {
        $this->renameDashboardSidebarLabels(
            'Conversations',
            'Livechat',
            'Saved replies',
        );
    }

    private function renameDashboardSidebarLabels(
        string $conversationsLabel,
        string $widgetLabel,
        string $savedRepliesLabel,
    ): void {
        $setting = Setting::where('name', 'menus')->first();

        if (!$setting || !is_array($setting->value)) {
            return;
        }

        $menus = $setting->value;
        $didUpdate = false;

        foreach ($menus as $menuIndex => $menu) {
            $positions = $menu['positions'] ?? [];

            if (!in_array('dashboard-sidebar', $positions, true)) {
                continue;
            }

            foreach (($menu['items'] ?? []) as $itemIndex => $item) {
                $action = $item['action'] ?? null;
                $nextLabel = match ($action) {
                    '/dashboard/conversations?viewId=mine' => $conversationsLabel,
                    '/dashboard/livechat' => $widgetLabel,
                    '/dashboard/saved-replies' => $savedRepliesLabel,
                    default => null,
                };

                if ($nextLabel && ($item['label'] ?? null) !== $nextLabel) {
                    $menus[$menuIndex]['items'][$itemIndex]['label'] = $nextLabel;
                    $didUpdate = true;
                }
            }
        }

        if ($didUpdate) {
            $setting->value = $menus;
            $setting->save();
            Cache::forget('settings.public');
        }
    }
};
