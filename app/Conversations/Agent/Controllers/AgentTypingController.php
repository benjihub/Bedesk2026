<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Events\ConversationTyping;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class AgentTypingController extends BaseController
{
    public function __invoke(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('update', $conversation);

        $data = request()->validate([
            'is_typing' => 'required|boolean',
        ]);

        event(new ConversationTyping($conversation, 'agent', $data['is_typing']));

        return $this->success();
    }
}
