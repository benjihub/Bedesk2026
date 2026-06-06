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
        $livechatItem = null;

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];
            if (!in_array('admin-sidebar', $positions)) {
                continue;
            }

            $items = collect($menu['items'] ?? []);
            $existing = $items->first(
                fn($item) => ($item['action'] ?? null) === '/admin/settings/livechat',
            );

            if ($existing) {
                $livechatItem = $existing;
                $menus[$index]['items'] = $items
                    ->reject(
                        fn($item) =>
                            ($item['action'] ?? null) === '/admin/settings/livechat',
                    )
                    ->values()
                    ->all();
                $didUpdate = true;
            }
        }

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];
            if (!in_array('dashboard-sidebar', $positions)) {
                continue;
            }

            $items = $menu['items'] ?? [];
            $hasLivechat = collect($items)->contains(
                fn($item) => ($item['action'] ?? null) === '/admin/settings/livechat',
            );

            if ($hasLivechat) {
                continue;
            }

            $itemToInsert = $livechatItem ?? [
                'label' => 'Livechat',
                'id' => 'lcadmin1',
                'action' => '/admin/settings/livechat',
                'type' => 'route',
                'permissions' => ['settings.update'],
            ];

            $conversationIndex = collect($items)->search(
                fn($item) =>
                    ($item['action'] ?? null) === '/dashboard/conversations?viewId=mine',
            );

            if ($conversationIndex === false) {
                $items[] = $itemToInsert;
            } else {
                array_splice($items, $conversationIndex + 1, 0, [$itemToInsert]);
            }

            $menus[$index]['items'] = $items;
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
        $livechatItem = null;

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];
            if (!in_array('dashboard-sidebar', $positions)) {
                continue;
            }

            $items = collect($menu['items'] ?? []);
            $existing = $items->first(
                fn($item) => ($item['action'] ?? null) === '/admin/settings/livechat',
            );

            if ($existing) {
                $livechatItem = $existing;
                $menus[$index]['items'] = $items
                    ->reject(
                        fn($item) =>
                            ($item['action'] ?? null) === '/admin/settings/livechat',
                    )
                    ->values()
                    ->all();
                $didUpdate = true;
            }
        }

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];
            if (!in_array('admin-sidebar', $positions)) {
                continue;
            }

            $items = $menu['items'] ?? [];
            $hasLivechat = collect($items)->contains(
                fn($item) => ($item['action'] ?? null) === '/admin/settings/livechat',
            );

            if ($hasLivechat) {
                continue;
            }

            $itemToInsert = $livechatItem ?? [
                'label' => 'Livechat',
                'id' => 'lcadmin1',
                'action' => '/admin/settings/livechat',
                'type' => 'route',
                'permissions' => ['settings.update'],
            ];

            $settingsIndex = collect($items)->search(
                fn($item) => ($item['action'] ?? null) === '/admin/settings',
            );

            if ($settingsIndex === false) {
                $items[] = $itemToInsert;
            } else {
                array_splice($items, $settingsIndex + 1, 0, [$itemToInsert]);
            }

            $menus[$index]['items'] = $items;
            $didUpdate = true;
        }

        if ($didUpdate) {
            $setting->value = $menus;
            $setting->save();
            Cache::forget('settings.public');
        }
    }
};
