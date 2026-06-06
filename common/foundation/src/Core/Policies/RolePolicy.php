<?php namespace Common\Core\Policies;

use App\Models\User;
use Common\Auth\Roles\Role;
use Illuminate\Auth\Access\HandlesAuthorization;

class RolePolicy
{
    use HandlesAuthorization;

    public function index(User $user): bool
    {
        return $user->hasPermission('roles.update');
    }

    public function show(User $user): bool
    {
        return $user->hasPermission('roles.update');
    }

    public function store(User $user): bool
    {
        return $user->hasPermission('roles.update');
    }

    public function update(User $user): bool
    {
        return $user->hasPermission('roles.update');
    }

    public function destroy(User $user, Role $role): bool
    {
        return !$role->internal && $user->hasPermission('roles.update');
    }
}
