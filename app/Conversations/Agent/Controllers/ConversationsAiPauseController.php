<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class ConversationsAiPauseController extends BaseController
{
    public function update()
    {
        $data = $this->validate(request(), [
            'conversationIds' => 'required|array|min:1',
            'conversationIds.*' => 'required|integer',
            'pause' => 'required|boolean',
        ]);

        $conversations = Conversation::whereIn('id', $data['conversationIds'])->get();

        $conversations->every(function (Conversation $conversation) {
            $this->authorize('update', $conversation);
        });

        if ($conversations->isEmpty()) {
            return $this->success();
        }

        $updatedEvent = new ConversationsUpdated($conversations);

        foreach ($conversations as $conversation) {
            if ($data['pause']) {
                $conversation->assigned_to = Conversation::ASSIGNED_AGENT;
                $conversation->assignee_id = null;
                $conversation->assigned_at = null;
            } else {
                $conversation->assigned_to = Conversation::ASSIGNED_BOT;
                $conversation->assignee_id = null;
                $conversation->assigned_at = null;
                $conversation->ai_agent_involved = true;
            }

            $conversation->save();
        }

        $updatedEvent->dispatch($conversations);

        return $this->success();
    }
}
