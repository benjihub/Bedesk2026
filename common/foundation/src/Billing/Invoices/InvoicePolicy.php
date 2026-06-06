<?php

namespace Common\Billing\Invoices;

use App\Models\User;
use Common\Core\Policies\BasePolicy;

class InvoicePolicy extends BasePolicy
{
    public function index(User $user, $userId = null): bool
    {
        return $user->hasPermission('plans.update') ||
            $user->id === (int) $userId;
    }

    public function show(User $user, Invoice $invoice): bool
    {
        return $user->hasPermission('plans.update') ||
            $invoice->subscription?->user_id == $user->id;
    }
}
