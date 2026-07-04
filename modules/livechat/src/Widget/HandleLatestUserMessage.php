<?php

namespace Livechat\Widget;

use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\AiAgent;
use Ai\AiAgent\Conversations\GroupReplyEngineAdapter;
use Ai\AiAgent\Conversations\GroupReplyEngine;
use Ai\AiAgent\Models\AiAgentSession;
use App\Core\WidgetFlags;

class HandleLatestUserMessage
{
    public function __construct(protected Conversation $conversation) {}

    public function execute()
    {
        $aiEnabled = settings('aiAgent.enabled') || WidgetFlags::isAiAgentPreviewMode();
        if (!$aiEnabled) {
            return;
        }

        // If this conversation was handed off to human support, allow AI to
        // automatically resume after support resolves the handoff.
        if ($this->conversation->assigned_to !== Conversation::ASSIGNED_BOT) {
            $this->maybeRestoreBotAssignmentAfterSupportHandoff();
        }

        // If conversation is still not assigned to AI, bail.
        if (
            $this->conversation->assigned_to !== Conversation::ASSIGNED_BOT ||
            (!class_exists(GroupReplyEngine::class) &&
                !class_exists(AiAgent::class))
        ) {
            return;
        }

        if (class_exists(GroupReplyEngineAdapter::class)) {
            return (new GroupReplyEngineAdapter($this->conversation))->handleLatestUserMessage();
        }

        if (class_exists(GroupReplyEngine::class)) {
            return (new GroupReplyEngine($this->conversation))->handleLatestUserMessage();
        }

        return (new AiAgent($this->conversation))->handleLatestUserMessage();
    }

    protected function maybeRestoreBotAssignmentAfterSupportHandoff(): void
    {
        // Only auto-restore from a known support handoff flow.
        if ($this->conversation->assigned_to !== Conversation::ASSIGNED_AGENT) {
            return;
        }

        // If a specific agent is explicitly assigned, treat this as a
        // manual/active human ownership and never auto-restore the bot.
        if (!empty($this->conversation->assignee_id)) {
            return;
        }

        $session = $this->conversation->aiAgentSession()->first();
        $context = is_array($session?->context ?? null) ? $session->context : [];

        $wasHandoff =
            array_key_exists('support_handoff_started_at', $context) ||
            array_key_exists('support_handoff_active', $context) ||
            array_key_exists('support_handoff_resolved_at', $context);

        if (!$session || !$wasHandoff) {
            return;
        }

        // Consider handoff resolved once support has completed/closed the conversation
        // or when the visible handoff tag has been removed by an agent.
        $tagStillPresent = false;
        try {
            $tagStillPresent = (bool) $this->conversation->tags()
                ->where('name', 'need-human-support')
                ->exists();
        } catch (\Throwable $ignore) {
            $tagStillPresent = true; // conservative: assume still present on error
        }

        $isResolved =
            (!empty($context['support_handoff_resolved_at'])) ||
            ($this->conversation->status_category <= Conversation::STATUS_CLOSED) ||
            (!$tagStillPresent);

        if (!$isResolved) {
            return;
        }

        // If something didn't clear the flag yet, clear it now.
        if (!empty($context['support_handoff_active'])) {
            $context['support_handoff_active'] = false;
            $context['support_handoff_resolved_at'] =
                $context['support_handoff_resolved_at'] ?? now()->toISOString();
            $session->context = $context;
            $session->save();
        }

        // Remove the handoff tag if present.
        try {
            $tagId = $this->conversation->tags()
                ->where('name', 'need-human-support')
                ->value('tags.id');
            if ($tagId) {
                $this->conversation->detachTag($tagId);
            }
        } catch (\Throwable $ignore) {
            // best-effort only
        }

        // Restore AI control.
        $this->conversation->update([
            'assigned_to' => Conversation::ASSIGNED_BOT,
            'assignee_id' => null,
            'assigned_at' => null,
            'ai_agent_involved' => true,
        ]);
    }
}
