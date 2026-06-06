<?php

namespace App\Conversations\Agent\Controllers;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;

class ConversationStatusesController extends BaseController
{
    public function index()
    {
        $this->authorize('index', Conversation::class);

        $pagination = (new Datasource(
            ConversationStatus::query(),
            request()->all(),
        ))->paginate();

        return $this->success(['pagination' => $pagination]);
    }

    public function store()
    {
        $this->authorize('index', Conversation::class);

        $data = request()->validate([
            'label' => 'required|string|max:100',
            'user_label' => 'nullable|string|max:100',
            'category' => 'required|integer',
            'active' => 'boolean',
        ]);

        $status = ConversationStatus::create($data);

        return $this->success(['status' => $status]);
    }

    public function update(int $id)
    {
        $this->authorize('index', Conversation::class);
        $this->blockOnDemoSite();

        $conversationStatus = ConversationStatus::findOrFail($id);

        $data = request()->validate([
            'label' => 'string|max:100',
            'user_label' => 'nullable|string|max:100',
            'category' => 'integer',
            'active' => 'boolean',
        ]);

        $conversationStatus->update($data);

        return $this->success(['status' => $conversationStatus]);
    }

    public function destroy(string $ids)
    {
        $this->authorize('index', Conversation::class);
        $this->blockOnDemoSite();

        $statusIds = explode(',', $ids);
        ConversationStatus::whereIn('id', $statusIds)->delete();

        return $this->success();
    }

    public function listForConversation()
    {
        $statuses = ConversationStatus::where('active', true)->get()->map(
            fn(ConversationStatus $status) => [
                'id' => $status->id,
                'label' =>
                    request('label') === 'agent'
                        ? $status->label
                        : $status->user_label ?? $status->label,
                'category' => $status->category,
            ],
        );

        return $this->success(['statuses' => $statuses]);
    }
}
