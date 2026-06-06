<?php

namespace Common\Core\Policies;

use App\Models\User;
use Common\Billing\Subscription;
use Illuminate\Auth\Access\HandlesAuthorization;

class SubscriptionPolicy
{
    use HandlesAuthorization;

    public function index(User $user)
    {
        return $user->hasPermission('subscriptions.update');
    }

    public function show(User $user, Subscription $subscription)
    {
        return $user->id === $subscription->user_id ||
            $user->hasPermission('subscriptions.update');
    }

    public function store(User $user)
    {
        return $user->hasPermission('subscriptions.update');
    }

    public function update(User $user)
    {
        return $user->hasPermission('subscriptions.update');
    }

    public function destroy(User $user)
    {
        return $user->hasPermission('subscriptions.update');
    }
}
