<?php

namespace Livechat\Controllers;

use App\Conversations\Models\Conversation;
use App\Models\User;
use Common\Core\BaseController;

class UserPageVisitsController extends BaseController
{
    public function index(int $userId)
    {
        $user = User::findOrFail($userId);

        $this->authorize('index', Conversation::class);

        $orderBy = request('orderBy', 'id');
        $orderDir = request('orderDir', 'desc');

        return [
            'pagination' => $user
                ->pageVisits()
                ->orderBy($orderBy, $orderDir)
                ->simplePaginate(),
        ];
    }
}
