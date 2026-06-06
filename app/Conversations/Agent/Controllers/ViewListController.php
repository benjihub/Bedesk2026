<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Agent\Actions\InboxViewsLoader;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class ViewListController extends BaseController
{
    public function __invoke()
    {
        $this->authorize('update', Conversation::class);

        return $this->success(['views' => (new InboxViewsLoader())->getAll()]);
    }
}
