<?php

namespace Livechat\Policies;

use App\Models\User;
use Common\Core\Policies\BasePolicy;
use Illuminate\Auth\Access\Response;

class CampaignPolicy extends BasePolicy
{
    public function index(User $user): bool|Response
    {
        return $this->hasPermission($user, 'campaigns.update');
    }

    public function show(User $user): bool|Response
    {
        return $this->hasPermission($user, 'campaigns.update');
    }

    public function store(User $user): bool|Response
    {
        return $this->hasPermission($user, 'campaigns.update');
    }

    public function update(User $user): bool|Response
    {
        return $this->hasPermission($user, 'campaigns.update');
    }

    public function destroy(User $user): bool|Response
    {
        return $this->hasPermission($user, 'campaigns.update');
    }
}
