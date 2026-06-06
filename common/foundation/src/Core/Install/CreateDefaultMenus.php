<?php

namespace Common\Core\Install;

use Common\Settings\LoadDefaultSettings;
use Common\Settings\Models\Setting;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class CreateDefaultMenus
{
    public function execute(): void
    {
        if (Setting::where('name', 'menus')->exists()) {
            return;
        }

        $menus = json_decode(
            Arr::first(
                (new LoadDefaultSettings())->execute(),
                fn($value) => $value['name'] === 'menus',
            )['value'],
            true,
        );

        foreach ($menus as $menuIndex => $menu) {
            if (!isset($menu['id'])) {
                $menu[$menuIndex]['id'] = Str::random(6);
            }
            foreach ($menu['items'] as $itemIndex => $item) {
                if (!isset($item['id'])) {
                    $menus[$menuIndex]['items'][$itemIndex]['id'] = Str::random(
                        6,
                    );
                }
                if (!isset($item['order'])) {
                    $menus[$menuIndex]['items'][$itemIndex][
                        'order'
                    ] = $itemIndex;
                }
            }
        }

        Setting::create([
            'name' => 'menus',
            'value' => json_encode($menus),
        ]);
    }
}
