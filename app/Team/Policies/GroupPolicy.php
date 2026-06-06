<?php

namespace App\Team\Policies;

use App\Models\User;
use Common\Core\Policies\BasePolicy;

class GroupPolicy extends BasePolicy
{
    public function index(User $user): bool
    {
        return $this->hasPermission($user, 'groups.view');
    }

    public function show(User $user): bool
    {
        return $this->hasPermission($user, 'groups.view');
    }

    public function store(User $user): bool
    {
        return $this->hasPermission($user, 'groups.create');
    }

    public function update(User $user): bool
    {
        return $this->hasPermission($user, 'groups.update');
    }

    public function destroy(User $user): bool
    {
        return $this->hasPermission($user, 'groups.delete');
    }
}
