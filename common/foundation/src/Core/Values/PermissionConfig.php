<?php

namespace Common\Core\Values;

use Common\Auth\Permissions\Permission;
use Illuminate\Support\Facades\Auth;

class PermissionConfig
{
    public function get(): array
    {
        $permissionConfig = require resource_path('defaults/permissions.php');

        $flatPermissions = [];

        foreach ($permissionConfig['all'] as $groupName => $group) {
            foreach ($group as $permission) {
                $permission['group'] = $groupName;
                $permission['type'] = $permission['type'] ?? 'users';
                $flatPermissions[] = $permission;
            }
        }

        return $flatPermissions;
    }

    public function getWithId(): array
    {
        $config = $this->get();
        $permissions = Permission::get();

        foreach ($config as $key => $permission) {
            $dbPermission = $permissions->first(
                fn(Permission $dbPermission) => $dbPermission->name ===
                    $permission['name'] &&
                    $dbPermission->type === $permission['type'],
            );
            $config[$key]['id'] = $dbPermission->id;

            if (
                $permission['name'] === 'admin' &&
                (!Auth::user() || !Auth::user()->hasExactPermission('admin'))
            ) {
                unset($config[$key]);
            }
        }

        return $config;
    }
}
