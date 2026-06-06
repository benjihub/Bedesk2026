<?php

use Common\Core\Values\PermissionConfig;
use Common\Database\Seeders\PermissionTableSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('permissions', 'display_name')) {
            Schema::dropColumns('permissions', ['display_name']);
        }
        if (Schema::hasColumn('permissions', 'description')) {
            Schema::dropColumns('permissions', ['description']);
        }
        if (Schema::hasColumn('permissions', 'restrictions')) {
            Schema::dropColumns('permissions', ['restrictions']);
        }
        if (Schema::hasColumn('permissions', 'group')) {
            Schema::dropColumns('permissions', ['group']);
        }
        if (Schema::hasColumn('permissions', 'advanced')) {
            Schema::dropColumns('permissions', ['advanced']);
        }

        $config = (new PermissionConfig())->get();
        $names = Arr::pluck($config, 'name');

        // first seed the new permissions
        app(PermissionTableSeeder::class)->run();

        // convert tickets.update to conversations.update
        $ticketsUpdateId = DB::table('permissions')
            ->where('name', 'tickets.update')
            ->first()?->id;
        $conversationsUpdateId = DB::table('permissions')
            ->where('name', 'conversations.update')
            ->first()?->id;
        if ($ticketsUpdateId && $conversationsUpdateId) {
            DB::table('permissionables')
                ->where('permission_id', $ticketsUpdateId)
                ->update(['permission_id' => $conversationsUpdateId]);
        }

        $dbPermissions = DB::table('permissions')->get();
        $deletedIds = [];

        // delete permissions that don't exist in config
        foreach ($dbPermissions as $permission) {
            if (
                !in_array($permission->name, $names) &&
                !in_array($permission->name, ['admin', 'superAdmin'])
            ) {
                DB::table('permissions')
                    ->where('id', $permission->id)
                    ->delete();
                $deletedIds[] = $permission->id;
            }
        }

        if (!empty($deletedIds)) {
            DB::table('permissionables')
                ->whereIn('permission_id', $deletedIds)
                ->delete();
        }
    }
};
