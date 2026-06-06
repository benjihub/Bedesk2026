<?php

namespace App\Conversations\Listeners;

use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;

class QueueDrainOnConversationClosed
{
    public function handle(ConversationsUpdated $event): void
    {
        foreach ($event->conversationsAfterUpdate as $conversation) {
            if (
                !$conversation instanceof Conversation ||
                $conversation->status_category > Conversation::STATUS_CLOSED
            ) {
                continue;
            }

            ConversationsAssigner::drainQueueIfNeeded($conversation->group_id);
        }
    }
}
