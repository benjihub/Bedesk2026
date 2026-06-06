<?php

use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        $setting = Setting::where('name', 'menus')->first();

        if (!$setting || !is_array($setting->value) || !count($setting->value)) {
            return;
        }

        $menus = $setting->value;
        $shouldUpdate = false;

        foreach ($menus as $index => $menu) {
            $positions = $menu['positions'] ?? [];
            $items = collect($menu['items'] ?? []);

            if (in_array('admin-sidebar', $positions)) {
                $hasAdminItem = $items->contains(
                    fn($item) => ($item['action'] ?? null) === '/admin/ai-agent',
                );

                if (!$hasAdminItem) {
                    $menus[$index]['items'][] = [
                        'label' => 'AI Agent',
                        'action' => '/admin/ai-agent',
                        'type' => 'route',
                        'id' => 'aiadm1',
                        'permissions' => ['ai_agent.update'],
                    ];
                    $shouldUpdate = true;
                }
            }

            if (in_array('dashboard-sidebar', $positions)) {
                $hasDashboardItem = $items->contains(
                    fn($item) => ($item['action'] ?? null) === '/dashboard/ai-agent',
                );

                if (!$hasDashboardItem) {
                    $menus[$index]['items'][] = [
                        'label' => 'AI Agent',
                        'action' => '/dashboard/ai-agent',
                        'type' => 'route',
                        'id' => 'aidas1',
                        'permissions' => ['ai_agent.update'],
                    ];
                    $shouldUpdate = true;
                }
            }
        }

        if ($shouldUpdate) {
            Setting::where('name', 'menus')->update([
                'value' => json_encode($menus),
            ]);
        }
    }

    public function down(): void
    {
        // noop
    }
};
