<?php

namespace App\Attributes\Policies;

use App\Attributes\Models\CustomAttribute;
use App\Models\User;
use Common\Core\Policies\BasePolicy;

class AttributePolicy extends BasePolicy
{
    public function index(User $user): bool
    {
        return $this->hasPermission($user, 'attributes.update');
    }

    public function show(User $user, CustomAttribute $attribute): bool
    {
        if ($attribute->type === 'internal') {
            return false;
        }

        return $this->hasPermission($user, 'attributes.update');
    }

    public function store(User $user): bool
    {
        return $this->hasPermission($user, 'attributes.update');
    }

    public function update(User $user, CustomAttribute $attribute): bool
    {
        return $this->hasPermission($user, 'attributes.update');
    }

    public function destroy(User $user, CustomAttribute $attribute): bool
    {
        if ($attribute->type === 'internal') {
            return false;
        }

        return $this->hasPermission($user, 'attributes.update');
    }
}
