<?php

use Common\Auth\Permissions\Permission;
use Common\Auth\Roles\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $permission = Permission::firstOrCreate(
            ['name' => 'ai_agent.update', 'type' => 'users'],
        );

        $roleIds = Role::whereIn('name', ['Agents', 'Admins'])->pluck('id');

        foreach ($roleIds as $roleId) {
            $exists = DB::table('permissionables')
                ->where('permission_id', $permission->id)
                ->where('permissionable_id', $roleId)
                ->where('permissionable_type', Role::MODEL_TYPE)
                ->exists();

            if (!$exists) {
                DB::table('permissionables')->insert([
                    'permission_id' => $permission->id,
                    'permissionable_id' => $roleId,
                    'permissionable_type' => Role::MODEL_TYPE,
                ]);
            }
        }
    }

    public function down(): void
    {
        $permissionId = Permission::where('name', 'ai_agent.update')
            ->where('type', 'users')
            ->value('id');

        if (!$permissionId) {
            return;
        }

        $roleIds = Role::whereIn('name', ['Agents', 'Admins'])->pluck('id');

        if ($roleIds->isEmpty()) {
            return;
        }

        DB::table('permissionables')
            ->where('permission_id', $permissionId)
            ->whereIn('permissionable_id', $roleIds)
            ->where('permissionable_type', Role::MODEL_TYPE)
            ->delete();
    }
};
