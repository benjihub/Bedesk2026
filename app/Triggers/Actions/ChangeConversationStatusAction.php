<?php namespace App\Triggers\Actions;

use App\Conversations\Actions\ConversationEventsCreator;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Triggers\Models\Trigger;

class ChangeConversationStatusAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $statusId = $action['value']['status_id'] ?? null;
        $status = $statusId ? ConversationStatus::find($statusId) : null;

        if (!$status || $conversation->status_id === $status->id) {
            return $conversation;
        }

        $conversation::changeStatus($status, [$conversation->id]);

        // If this status change would close the conversation, but the
        // conversation is currently in an active human support handoff,
        // do not allow triggers to auto-close it. Human support should
        // control resolution explicitly.
        try {
            $session = $conversation->aiAgentSession()->first();
            $context = is_array($session?->context ?? null) ? $session->context : [];
            $isHandoffActive = !empty($context['support_handoff_active']);
        } catch (\Throwable $_) {
            $isHandoffActive = false;
        }

        if ($status->category <= Conversation::STATUS_CLOSED) {
            if ($isHandoffActive) {
                // Skip auto-closing while support handoff is active.
                return $conversation;
            }

            (new ConversationEventsCreator($conversation))->closedByTrigger();
        }

        // 'unload' status relationship in case it was already loaded
        // on given conversation so removed status is properly removed
        // the next time status relationship is accessed
        $conversation->unsetRelation('status');

        return $conversation;
    }
}
