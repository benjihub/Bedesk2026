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
            if (!in_array('dashboard-sidebar', $positions)) {
                continue;
            }

            $items = $menu['items'] ?? [];

            $existing = collect($items)->first(
                fn($item) => ($item['action'] ?? null) === '/dashboard/overview',
            );

            if ($existing) {
                continue;
            }

            array_unshift($items, [
                'label' => 'Dashboard',
                'id' => 'dashov1',
                'action' => '/dashboard/overview',
                'type' => 'route',
                'permissions' => ['conversations.update'],
            ]);

            $menu['items'] = $items;
            $menus[$index] = $menu;
            $didUpdate = true;
        }

        if ($didUpdate) {
            $setting->value = $menus;
            $setting->save();
            Cache::forget('settings.public');
        }
    }

    public function down(): void
    {
        // noop
    }
};
