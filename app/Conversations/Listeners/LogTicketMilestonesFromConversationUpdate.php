<?php

namespace App\Conversations\Listeners;

use App\Conversations\Actions\TicketEventLogger;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;

class LogTicketMilestonesFromConversationUpdate
{
    public function handle(ConversationsUpdated $event): void
    {
        $logger = app(TicketEventLogger::class);

        foreach ($event->conversationsAfterUpdate as $conversation) {
            if ($conversation->type !== 'ticket') {
                continue;
            }

            $before = $event->conversationsDataBeforeUpdate[
                $conversation->id
            ] ?? null;

            if (!$before) {
                continue;
            }

            $oldAssigneeId = $before['assignee_id'] ?? null;
            $newAssigneeId = $conversation->assignee_id;

            if ($oldAssigneeId !== $newAssigneeId) {
                $logger->logAssigned(
                    $conversation,
                    $oldAssigneeId,
                    $newAssigneeId,
                );
            }

            $oldStatus = $before['status_category'] ?? null;
            $newStatus = $conversation->status_category;

            if ($oldStatus !== null && $newStatus !== null) {
                if (
                    $oldStatus > Conversation::STATUS_CLOSED &&
                    $newStatus <= Conversation::STATUS_CLOSED
                ) {
                    $logger->logClosed($conversation, $oldStatus, $newStatus);
                }

                if (
                    $oldStatus <= Conversation::STATUS_CLOSED &&
                    $newStatus > Conversation::STATUS_CLOSED
                ) {
                    $logger->logReopened(
                        $conversation,
                        $oldStatus,
                        $newStatus,
                    );
                }
            }
        }
    }
}
