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

            if (!in_array('dashboard-sidebar', $positions, true)) {
                continue;
            }

            $items = $menu['items'] ?? [];
            $hasBilling = collect($items)->contains(
                fn($item) => ($item['action'] ?? null) === '/dashboard/billing',
            );

            if ($hasBilling) {
                continue;
            }

            $billingItem = [
                'label' => 'Billing',
                'action' => '/dashboard/billing',
                'type' => 'route',
                'id' => 'billdash1',
                'permissions' => ['admin'],
            ];

            $insertAfterIndex = collect($items)->search(
                fn($item) => ($item['action'] ?? null) === '/dashboard/ai-agent',
            );

            if ($insertAfterIndex === false) {
                $insertAfterIndex = collect($items)->search(
                    fn($item) => ($item['action'] ?? null) === '/dashboard/reports',
                );
            }

            if ($insertAfterIndex === false) {
                $items[] = $billingItem;
            } else {
                array_splice($items, $insertAfterIndex + 1, 0, [$billingItem]);
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

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];

            if (!in_array('dashboard-sidebar', $positions, true)) {
                continue;
            }

            $menus[$index]['items'] = collect($menu['items'] ?? [])
                ->reject(
                    fn($item) =>
                        ($item['action'] ?? null) === '/dashboard/billing',
                )
                ->values()
                ->all();
            $didUpdate = true;
        }

        if ($didUpdate) {
            $setting->value = $menus;
            $setting->save();
            Cache::forget('settings.public');
        }
    }
};
