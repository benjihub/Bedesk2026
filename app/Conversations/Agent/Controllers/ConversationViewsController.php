<?php

namespace App\Conversations\Agent\Controllers;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationView;
use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ConversationViewsController extends BaseController
{
    public function index()
    {
        $this->authorize('index', Conversation::class);

        $params = request()->all();
        if (!isset($params['orderBy'])) {
            $params['orderBy'] = 'order';
            $params['orderDir'] = 'asc';
        }

        $datasource = new Datasource(
            ConversationView::query()->select([
                'id',
                'name',
                'internal',
                'active',
                'icon',
                'access',
                'pinned',
                'owner_id',
                'description',
                'updated_at',
            ]),
            $params,
        );

        $pagination = $datasource->paginate();

        $pagination->load(['user', 'group']);

        return $this->success(['pagination' => $pagination]);
    }

    public function show(ConversationView $view)
    {
        $this->authorize('index', Conversation::class);
        return $this->success(['view' => $view]);
    }

    public function update(ConversationView $view)
    {
        $this->authorize('index', Conversation::class);

        $rules = [
            'name' => 'string|max:255',
            'icon' => 'nullable|string|max:60',
            'pinned' => 'boolean',
            'description' => 'nullable|string|max:255',
            'columns' => 'array|nullable',
            'order_by' => 'string|max:100',
            'order_dir' => 'string|in:asc,desc',
        ];
        if (!$view->internal) {
            $rules['access'] = 'string|in:anyone,owner,group';
            $rules['group_id'] = 'nullable|int';
            $rules['conditions'] = 'array';
            $rules['active'] = 'boolean';
        }

        $data = $this->validate(request(), $rules);

        $view->update($data);

        return $this->success(['view' => $view]);
    }

    public function store()
    {
        $this->authorize('index', Conversation::class);

        $data = $this->validate(request(), [
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:60',
            'access' => 'required|string|in:anyone,owner,group',
            'pinned' => 'boolean',
            'conditions' => 'array',
            'description' => 'nullable|string|max:255',
            'group_id' => 'nullable|int',
            'columns' => 'array',
            'order_by' => 'string|max:100',
            'order_dir' => 'string|in:asc,desc',
        ]);

        $view = ConversationView::create([...$data, 'owner_id' => Auth::id()]);

        return $this->success(['view' => $view]);
    }

    public function destroy(ConversationView $view)
    {
        $this->authorize('index', Conversation::class);
        $this->blockOnDemoSite();

        if ($view->internal) {
            return $this->error('System views can not be deleted');
        }

        $view->delete();

        return $this->success();
    }

    public function reorder()
    {
        $this->authorize('index', Conversation::class);

        $data = request()->validate([
            'viewIds' => 'array|min:1',
        ]);

        $queryPart = '';
        foreach ($data['viewIds'] as $order => $id) {
            $queryPart .= " when id=$id then $order";
        }

        DB::table('conversation_views')
            ->whereIn('id', $data['viewIds'])
            ->update(['order' => DB::raw("(case $queryPart end)")]);

        return $this->success();
    }
}
