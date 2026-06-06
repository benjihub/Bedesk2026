<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $settings = DB::table('settings')->where('name', 'menus')->first();

        if ($settings) {
            $menus = json_decode($settings->value, true);

            foreach ($menus as $menuKey => $menu) {
                if (in_array('admin-sidebar', $menu['positions'])) {
                    foreach ($menu['items'] as $itemKey => $item) {
                        if ($item['action'] === '/admin/appearance') {
                            unset($menus[$menuKey]['items'][$itemKey]);
                        }
                        if ($item['action'] === '/admin/settings') {
                            $menus[$menuKey]['items'][$itemKey]['action'] =
                                '/admin/settings/general';
                        }
                    }
                    $menus[$menuKey]['items'] = array_values(
                        $menus[$menuKey]['items'],
                    );
                }
            }

            $settings->value = json_encode($menus);
            DB::table('settings')
                ->where('name', 'menus')
                ->update([
                    'value' => $settings->value,
                ]);
        }
    }
};
