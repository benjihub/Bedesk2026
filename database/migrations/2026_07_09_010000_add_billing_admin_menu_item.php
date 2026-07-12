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
            $hasBilling = collect($items)->contains(
                fn($item) => ($item['action'] ?? null) === '/admin/billing',
            );

            if ($hasBilling) {
                continue;
            }

            $billingItem = [
                'label' => 'Billing',
                'action' => '/admin/billing',
                'type' => 'route',
                'id' => 'billadm1',
                'permissions' => ['admin'],
            ];

            $aiAgentIndex = collect($items)->search(
                fn($item) => ($item['action'] ?? null) === '/admin/ai-agent',
            );

            if ($aiAgentIndex === false) {
                $items[] = $billingItem;
            } else {
                array_splice($items, $aiAgentIndex + 1, 0, [$billingItem]);
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

            if (!in_array('admin-sidebar', $positions)) {
                continue;
            }

            $items = collect($menu['items'] ?? []);
            $menus[$index]['items'] = $items
                ->reject(
                    fn($item) =>
                        ($item['action'] ?? null) === '/admin/billing',
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
