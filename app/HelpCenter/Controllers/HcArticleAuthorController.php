<?php

namespace App\HelpCenter\Controllers;

use App\HelpCenter\Models\HcArticle;
use App\Models\User;
use Common\Auth\Actions\PaginateUsers;
use Common\Core\BaseController;

class HcArticleAuthorController extends BaseController
{
    public function index()
    {
        $this->authorize('update', HcArticle::class);

        $params = array_merge(request()->all(), [
            'permission' => 'articles.update',
            'perPage' => 10,
        ]);

        $users = (new PaginateUsers())
            ->execute($params)
            ->map(fn(User $user) => $user->toNormalizedArray());

        return $this->success(['results' => $users]);
    }

    public function show(int $userId)
    {
        $this->authorize('update', HcArticle::class);

        return $this->success([
            'model' => User::findOrFail($userId)->toNormalizedArray(),
        ]);
    }
}
