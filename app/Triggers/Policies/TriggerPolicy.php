<?php namespace App\Triggers\Policies;

use App\Models\User;
use Common\Core\Policies\BasePolicy;

class TriggerPolicy extends BasePolicy
{
    public function index(User $user)
    {
        return $user->hasPermission('triggers.view') ||
            $user->hasPermission('triggers.update');
    }

    public function show(User $user)
    {
        return $user->hasPermission('triggers.view') ||
            $user->hasPermission('triggers.update');
    }

    public function store(User $user)
    {
        return $user->hasPermission('triggers.create') ||
            $user->hasPermission('triggers.update');
    }

    public function update(User $user)
    {
        return $user->hasPermission('triggers.update');
    }

    public function destroy(User $user)
    {
        return $user->hasPermission('triggers.delete') ||
            $user->hasPermission('triggers.update');
    }
}
