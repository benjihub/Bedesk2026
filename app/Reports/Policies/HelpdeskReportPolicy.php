<?php

namespace App\Reports\Policies;

use App\Models\User;
use Common\Core\Policies\BasePolicy;

class HelpdeskReportPolicy extends BasePolicy
{
    public function show(User $user): bool
    {
        return $this->hasPermission($user, 'reports.view');
    }
}
