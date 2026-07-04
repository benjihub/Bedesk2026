<?php

namespace Ai\AiAgent\Conversations;

use Ai\AiAgent\Models\AiAgentSession;
use App\Conversations\Actions\TicketEventLogger;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Models\Conversation;
use Common\Tags\Tag;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

/**
 * Manages support handoff and resumption logic.
 *
 * Handles:
 * - Triggering handoff when AI reaches processing/wait state
 * - Checking if handoff should be resumed (agent clears tag, status set to pending, or reassigned to bot)
 * - Clearing handoff state when resuming
 */
class AIHandoffManager
{
    private Conversation $conversation;

    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation;
    }

    /**
     * If the reply is in a "processing" state, handoff to support.
     * This involves:
     * - Marking session context so we can restore AI later
     * - Tagging the conversation for visibility
     * - Logging the event
     * - Assigning to first available agent
     */
    public function handoffToSupportIfNeeded(array $replyObj, string $replyText): void
    {
        // Only handoff if AI is currently handling this conversation.
        if ($this->conversation->assigned_to !== Conversation::ASSIGNED_BOT) {
            return;
        }

        $intent = (string) Arr::get($replyObj, 'intent', '');
        $processing = (bool) Arr::get($replyObj, 'context.processing', false);

        // We treat the explicit "processing / wait" state as a support handoff trigger.
        // (Avoid relying on text heuristics so normal replies don't accidentally escalate.)
        $isWaitState =
            $processing ||
            in_array($intent, ['processing', 'still_processing'], true);

        if (!$isWaitState) {
            return;
        }

        // Mark in session context so we can restore AI control later.
        $session = AiAgentSession::firstOrCreate(
            ['conversation_id' => $this->conversation->id],
            ['status' => AiAgentSession::STATUS_ACTIVE, 'context' => []],
        );
        $context = is_array($session->context ?? null) ? $session->context : [];
        if (!empty($context['support_handoff_active'])) {
            return; // already handed off
        }

        $context['support_handoff_active'] = true;
        $context['support_handoff_intent'] = $intent !== '' ? $intent : null;
        $context['support_handoff_user_id'] = Arr::get($replyObj, 'context.userId');
        $context['support_handoff_started_at'] = now()->toISOString();
        $session->context = $context;
        $session->save();

        // Add a visible tag for agents so it shows in inbox/list.
        // Store as slug + display name so UI can show friendly text.
        try {
            $tag = Tag::firstOrCreate(
                ['name' => 'need-human-support'],
                ['display_name' => 'Need human support', 'type' => 'custom'],
            );
            $this->conversation->attachTag($tag->id);
            app(TicketEventLogger::class)->logNeedHumanSupport(
                conversation: $this->conversation,
                metadata: [
                    'intent' => $context['support_handoff_intent'],
                    'tag_id' => $tag->id,
                    'user_id' => $context['support_handoff_user_id'],
                ],
                createdAt: $context['support_handoff_started_at'],
            );
        } catch (\Throwable $ignore) {
            // best-effort only
        }

        // Assign to support (this also broadcasts updates so agents get notified).
        try {
            $this->conversation->loadMissing('group');
            ConversationsAssigner::assignConversationToFirstAvailableAgent(
                $this->conversation,
                addEvent: true,
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to handoff conversation to support', [
                'conversation_id' => $this->conversation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Should AI resume normal operation after a human support handoff?
     * Conditions:
     * - Conversation status is set to PENDING by an agent, or
     * - Human-support tag ("need-human-support") is no longer present, or
     * - Conversation is reassigned back to bot
     */
    public function shouldResumeAfterHandoff(): bool
    {
        try {
            // Check session context flag
            $session = $this->conversation->aiAgentSession()->first();
            $context = is_array($session?->context ?? null) ? $session->context : [];
            if (empty($context['support_handoff_active'])) {
                return true; // no active handoff, proceed normally
            }

            // If conversation has been reassigned back to the bot, resume immediately.
            // This provides a manual override so agents can return control to AI
            // without needing to change status or tags first.
            try {
                $this->conversation->refresh();
                if (($this->conversation->assigned_to ?? null) === Conversation::ASSIGNED_BOT) {
                    return true;
                }
            } catch (\Throwable $_) { /* ignore */ }

            // Check conversation status
            $this->conversation->loadMissing(['status', 'tags']);
            $statusCategory = (int) ($this->conversation->status_category ?? 0);
            $isPending = ($statusCategory === Conversation::STATUS_PENDING);

            // Check presence of human-support tag
            $hasNeedHumanTag = false;
            try {
                $hasNeedHumanTag = (bool) ($this->conversation->tags?->contains(function ($tag) {
                    return ($tag->name ?? null) === 'need-human-support';
                }) ?? false);
            } catch (\Throwable $_) { /* ignore */ }

            // Resume if pending OR tag removed
            return $isPending || !$hasNeedHumanTag;
        } catch (\Throwable $_) {
            // If we can't determine, do not block AI
            return true;
        }
    }

    /**
     * Clear support handoff state in session so AI can continue.
     */
    public function clearSupportHandoff(): void
    {
        try {
            $session = $this->conversation->aiAgentSession()->firstOrCreate(
                ['conversation_id' => $this->conversation->id],
                ['status' => AiAgentSession::STATUS_ACTIVE, 'context' => []],
            );
            $context = is_array($session->context ?? null) ? $session->context : [];
            unset($context['support_handoff_active']);
            unset($context['support_handoff_intent']);
            unset($context['support_handoff_user_id']);
            $context['support_handoff_finished_at'] = now()->toISOString();
            $session->context = $context;
            $session->save();

            // Best-effort: remove the visible human-support tag so UI returns to normal.
            try {
                $tag = Tag::where('name', 'need-human-support')->first();
                if ($tag && method_exists($this->conversation, 'detachTag')) {
                    $this->conversation->detachTag($tag->id);
                }
            } catch (\Throwable $_) { /* ignore */ }
        } catch (\Throwable $_) {
            // best effort only
        }
    }
}
