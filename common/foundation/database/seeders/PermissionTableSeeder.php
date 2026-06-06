<?php namespace Common\Database\Seeders;

use Common\Auth\Permissions\Permission;
use Common\Core\Values\PermissionConfig;
use Illuminate\Database\Seeder;

class PermissionTableSeeder extends Seeder
{
    public function run(): void
    {
        $allPermissions = (new PermissionConfig())->get();

        foreach ($allPermissions as $permission) {
            app(Permission::class)->updateOrCreate([
                'name' => $permission['name'],
                'type' => $permission['type'],
            ]);
        }
    }
}
