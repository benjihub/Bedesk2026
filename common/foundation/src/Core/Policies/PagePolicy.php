<?php namespace Common\Core\Policies;

use App\Models\User;
use Common\Pages\CustomPage;

class PagePolicy extends BasePolicy
{
    public function index(?User $user, int $userId = null)
    {
        return $user->hasPermission('custom_pages.update') ||
            $user->id === $userId;
    }

    public function show(?User $user, CustomPage $customPage)
    {
        return true;
    }

    public function store(User $user)
    {
        return $user->hasPermission('custom_pages.update');
    }

    public function update(User $user)
    {
        return $user->hasPermission('custom_pages.update');
    }

    public function destroy(User $user, $pageIds)
    {
        if ($user->hasPermission('custom_pages.update')) {
            return true;
        } else {
            $dbCount = app(CustomPage::class)
                ->whereIn('id', $pageIds)
                ->where('user_id', $user->id)
                ->count();
            return $dbCount === count($pageIds);
        }
    }
}
