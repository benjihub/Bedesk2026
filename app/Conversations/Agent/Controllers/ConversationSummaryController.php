<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Models\Conversation;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Schema;

class ConversationSummaryController extends BaseController
{
    public function show(int $conversationId)
    {
        try {
            $conversation = Conversation::findOrFail($conversationId);

            $this->authorize('show', $conversation);

            // Only attempt to load summary if AI module model and DB table exist
            $summary = null;
            if (class_exists(\Ai\AiAgent\Models\ConversationSummary::class) && Schema::hasTable('conversation_summaries')) {
                $summary = $conversation->summary;
            }

            return $this->success(['summary' => $summary]);
        } catch (\Throwable $e) {
            // Log error with context so we can diagnose the 500
            \Log::error('Failed to load conversation summary', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage(),
                'trace' => \substr($e->getTraceAsString(), 0, 1000),
            ]);

            return $this->error('Failed to load conversation summary', 500);
        }
    }
}
