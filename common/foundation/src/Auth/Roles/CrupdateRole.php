<?php

namespace Common\Auth\Roles;

use Common\Auth\Permissions\Traits\SyncsPermissions;
use Common\Auth\Roles\Role;
use Illuminate\Support\Arr;

class CrupdateRole
{
    use SyncsPermissions;

    public function execute($data, $role = null)
    {
        if (!$role) {
            $role = new Role();
        }

        $attributes = [];

        if (array_key_exists('name', $data)) {
            $attributes['name'] = $data['name'];
        }

        if (array_key_exists('description', $data)) {
            $attributes['description'] = $data['description'] ?? null;
        }

        if (array_key_exists('default', $data)) {
            $attributes['default'] = $data['default'] ?? false;
        }

        if (array_key_exists('guests', $data)) {
            $attributes['guests'] = $data['guests'] ?? false;
        }

        if (array_key_exists('type', $data)) {
            $attributes['type'] = $data['type'] ?? 'users';
        }

        $role->fill($attributes)->save();

        // always sync permissions, detach all if "null" is given as permissions
        $this->syncPermissions($role, Arr::get($data, 'permissions', []));

        return $role;
    }
}
