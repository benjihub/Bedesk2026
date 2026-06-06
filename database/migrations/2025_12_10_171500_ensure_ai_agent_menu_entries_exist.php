<?php

use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;

return new class extends Migration {
    public function up(): void
    {
        $setting = Setting::where('name', 'menus')->first();

        if (!$setting || !is_array($setting->value)) {
            return;
        }

        $menus = $setting->value;
        $didUpdate = false;

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];
            $items = $menu['items'] ?? [];

            if (in_array('admin-sidebar', $positions)) {
                $items = $this->ensureMenuItem(
                    $items,
                    '/admin/ai-agent',
                    $didUpdate,
                );
            }

            if (in_array('dashboard-sidebar', $positions)) {
                $items = $this->ensureMenuItem(
                    $items,
                    '/dashboard/ai-agent',
                    $didUpdate,
                );
            }

            $menu['items'] = $items;
            $menus[$index] = $menu;
        }

        if ($didUpdate) {
            $setting->value = $menus;
            $setting->save();
        }

        Cache::forget('settings.public');
    }

    public function down(): void {}

    private function ensureMenuItem(
        array $items,
        string $action,
        bool &$didUpdate,
    ): array {
        $existing = collect($items)->first(
            fn($item) => ($item['action'] ?? null) === $action,
        );

        if ($existing) {
            return $items;
        }

        $items[] = [
            'label' => 'AI Agent',
            'action' => $action,
            'type' => 'route',
            'id' => $action === '/admin/ai-agent' ? 'aiadm1' : 'aidas1',
            'permissions' => ['ai_agent.update'],
        ];

        $didUpdate = true;

        return $items;
    }
};
