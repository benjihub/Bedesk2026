<?php namespace Common\Core\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class LocalizationPolicy
{
    use HandlesAuthorization;

    public function index(?User $user)
    {
        return $user->hasPermission('localizations.view') ||
            $user->hasPermission('localizations.update');
    }

    public function show(?User $user)
    {
        return $user->hasPermission('localizations.view') ||
            $user->hasPermission('localizations.update');
    }

    public function store(User $user)
    {
        return $user->hasPermission('localizations.create') ||
            $user->hasPermission('localizations.update');
    }

    public function update(User $user)
    {
        return $user->hasPermission('localizations.update');
    }

    public function destroy(User $user)
    {
        return $user->hasPermission('localizations.delete') ||
            $user->hasPermission('localizations.update');
    }
}
