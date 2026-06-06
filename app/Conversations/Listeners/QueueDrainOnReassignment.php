<?php

namespace App\Conversations\Listeners;

use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Events\ConversationsAssignedToAgent;
use Illuminate\Support\Facades\Log;

class QueueDrainOnReassignment
{
    public function handle(ConversationsAssignedToAgent $event): void
    {
        // After agents are assigned, drain queue for their group
        $event->conversations->each(function ($conversation) {
            if (!$conversation->group_id) {
                return;
            }

            try {
                ConversationsAssigner::drainQueueIfNeeded((int) $conversation->group_id);
            } catch (\Throwable $e) {
                Log::warning('Queue drain failed on reassignment', [
                    'conversation_id' => $conversation->id,
                    'group_id' => $conversation->group_id,
                    'error' => $e->getMessage(),
                ]);
            }
        });
    }
}