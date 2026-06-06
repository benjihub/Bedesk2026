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
            if (!in_array('admin-sidebar', $positions)) {
                continue;
            }

            $items = $menu['items'] ?? [];

            $existing = collect($items)->first(
                fn($item) => ($item['action'] ?? null) === '/admin/settings/livechat',
            );

            if ($existing) {
                continue;
            }

            $insertAt = collect($items)->search(
                fn($item) => ($item['action'] ?? null) === '/admin/settings',
            );

            $livechatItem = [
                'label' => 'Livechat',
                'id' => 'lcadmin1',
                'action' => '/admin/settings/livechat',
                'type' => 'route',
                'permissions' => ['settings.update'],
            ];

            if ($insertAt === false) {
                $items[] = $livechatItem;
            } else {
                array_splice($items, $insertAt + 1, 0, [$livechatItem]);
            }

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
        $setting = Setting::where('name', 'menus')->first();

        if (!$setting || !is_array($setting->value)) {
            return;
        }

        $menus = $setting->value;
        $didUpdate = false;

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];
            if (!in_array('admin-sidebar', $positions)) {
                continue;
            }

            $items = collect($menu['items'] ?? [])
                ->reject(
                    fn($item) => ($item['action'] ?? null) === '/admin/settings/livechat',
                )
                ->values()
                ->all();

            if (count($items) !== count($menu['items'] ?? [])) {
                $menu['items'] = $items;
                $menus[$index] = $menu;
                $didUpdate = true;
            }
        }

        if ($didUpdate) {
            $setting->value = $menus;
            $setting->save();
            Cache::forget('settings.public');
        }
    }
};
