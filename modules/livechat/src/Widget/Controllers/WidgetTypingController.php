<?php

namespace Livechat\Widget\Controllers;

use App\Conversations\Events\ConversationTyping;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Log;

class WidgetTypingController extends BaseController
{
    public function __invoke(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('show', $conversation);

        $data = request()->validate([
            'is_typing' => 'required|boolean',
        ]);

        try {
            event(
                new ConversationTyping(
                    $conversation,
                    'user',
                    $data['is_typing'],
                ),
            );
        } catch (\Throwable $e) {
            Log::warning('Widget typing broadcast failed', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->success();
    }
}
