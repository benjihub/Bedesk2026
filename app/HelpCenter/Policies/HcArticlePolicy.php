<?php namespace App\HelpCenter\Policies;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use App\Models\User;
use Common\Core\Policies\BasePolicy;

class HcArticlePolicy extends BasePolicy
{
    public function index(?User $user)
    {
        return $this->hasPermission($user, 'articles.update') ||
            $this->hasPermission($user, 'articles.view');
    }

    public function show(?User $user, HcArticle $hcArticle)
    {
        if ($hcArticle->draft && !$user?->isAgent()) {
            return false;
        }

        return $this->hasPermission($user, 'articles.update') ||
            $this->hasPermission($user, 'articles.view');
    }

    public function store(User $user)
    {
        return $this->hasPermission($user, 'articles.create') ||
            $this->hasPermission($user, 'articles.update');
    }

    public function update(
        User $user,
        HcArticle|HcCategory|null $articleOrCategory = null,
    ) {
        return $this->hasPermission($user, 'articles.update') ||
            ($articleOrCategory &&
                $user->roles
                    ->pluck('id')
                    ->contains($articleOrCategory->managed_by_role));
    }

    public function destroy(User $user)
    {
        return $this->hasPermission($user, 'articles.update') ||
            $this->hasPermission($user, 'articles.delete');
    }
}
