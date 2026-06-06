<?php

namespace Common\Core\Policies;

use App\Models\User;

class TagPolicy extends BasePolicy
{
    public function index(?User $user)
    {
        return $this->hasPermission($user, 'tags.view') ||
            $this->hasPermission($user, 'tags.update');
    }

    public function show(?User $user)
    {
        return $this->hasPermission($user, 'tags.view') ||
            $this->hasPermission($user, 'tags.update');
    }

    public function store(User $user)
    {
        return $this->hasPermission($user, 'tags.create') ||
            $this->hasPermission($user, 'tags.update');
    }

    public function update(User $user)
    {
        return $this->hasPermission($user, 'tags.update');
    }

    public function destroy(User $user)
    {
        return $this->hasPermission($user, 'tags.delete') ||
            $this->hasPermission($user, 'tags.update');
    }
}
