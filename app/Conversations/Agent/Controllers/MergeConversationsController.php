<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Agent\Actions\MergeConversations;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class MergeConversationsController extends BaseController
{
    public function __invoke()
    {
        $data = $this->validate(request(), [
            'conversationId' => 'required|integer|exists:conversations,id',
            'toMerge' => 'required|array',
        ]);

        $conversation = Conversation::findOrFail($data['conversationId']);
        $toMerge = Conversation::whereIn('id', $data['toMerge'])->get();

        $this->authorize('update', $conversation);

        if (!$toMerge->isEmpty()) {
            (new MergeConversations())->execute($conversation, $toMerge);
        }

        return $this->success([
            'conversation' => $conversation,
        ]);
    }
}
