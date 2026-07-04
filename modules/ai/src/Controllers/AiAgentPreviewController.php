<?php

namespace Ai\Controllers;

use App\Conversations\Agent\Actions\DeleteMultipleConversations;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class AiAgentPreviewController extends BaseController
{
    public function destroyConversation(Conversation $conversation)
    {
        $this->authorize('ai_agent.update');

        if ($conversation->mode !== Conversation::MODE_PREVIEW) {
            return $this->error('Only preview conversations can be reset.', [], 422);
        }

        (new DeleteMultipleConversations())->execute([$conversation->id]);

        return $this->success([], 204);
    }
}
