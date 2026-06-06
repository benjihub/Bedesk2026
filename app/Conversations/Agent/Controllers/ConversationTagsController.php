<?php

namespace App\Conversations\Agent\Controllers;

use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Actions\TicketEventLogger;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Models\AiAgentSession;
use Common\Core\BaseController;
use Common\Tags\Tag;
use Illuminate\Support\Facades\Auth;

class ConversationTagsController extends BaseController
{
    public function index(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('show', $conversation);

        return $this->success([
            'tags' => $conversation
                ->tags()
                ->get()
                ->map(
                    fn(Tag $tag) => [
                        'id' => $tag->id,
                        'name' => $tag->display_name ?? $tag->name,
                    ],
                ),
        ]);
    }

    public function add()
    {
        $data = request()->validate([
            'tagId' => 'int',
            'newTagName' => 'string|max:100',
            'conversationIds' => 'required|array',
        ]);

        $conversations = Conversation::whereIn(
            'id',
            $data['conversationIds'],
        )->get();

        foreach ($conversations as $conversation) {
            $this->authorize('update', $conversation);
        }

        $tagId = isset($data['newTagName'])
            ? Tag::firstOrCreate(
                [
                    'name' => $data['newTagName'],
                ],
                ['user_id' => Auth::id()],
            )->id
            : $data['tagId'];

        app(Conversation::class)->attachTag(
            $tagId,
            $conversations->pluck('id')->toArray(),
        );

        try {
            $tag = Tag::find($tagId);
            if ($tag && $tag->name === 'need-human-support') {
                foreach ($conversations as $conversation) {
                    $session = $conversation->aiAgentSession()->firstOrCreate(
                        ['conversation_id' => $conversation->id],
                        ['status' => AiAgentSession::STATUS_ACTIVE, 'context' => []],
                    );
                    $context = is_array($session->context ?? null)
                        ? $session->context
                        : [];
                    $context['support_handoff_active'] = true;
                    $context['support_handoff_started_at'] = $context['support_handoff_started_at']
                        ?? now()->toISOString();
                    $session->context = $context;
                    $session->save();

                    app(TicketEventLogger::class)->logNeedHumanSupport(
                        conversation: $conversation,
                        actor: Auth::user(),
                        metadata: ['tag_id' => $tag->id],
                        createdAt: $context['support_handoff_started_at'] ??
                            null,
                    );

                    if (
                        $conversation->assigned_to === Conversation::ASSIGNED_BOT ||
                        !$conversation->assignee_id
                    ) {
                        ConversationsAssigner::assignConversationToFirstAvailableAgent(
                            $conversation,
                            addEvent: true,
                        );
                    }
                }
            }
        } catch (\Throwable $_) {
            // best-effort only
        }

        return $this->success();
    }

    public function remove()
    {
        $data = request()->validate([
            'tagId' => 'required',
            'conversationIds' => 'required|array',
        ]);

        $conversations = Conversation::whereIn(
            'id',
            $data['conversationIds'],
        )->get();

        foreach ($conversations as $conversation) {
            $this->authorize('update', $conversation);
        }

        app(Conversation::class)->detachTag(
            $data['tagId'],
            $conversations->pluck('id')->toArray(),
        );

        // If removed tag was human support handoff, clear ai handoff context
        // and restore bot assignment for affected conversations.
        try {
            $tag = Tag::find($data['tagId']);
            if ($tag && $tag->name === 'need-human-support') {
                foreach ($conversations as $conversation) {
                    try {
                        $session = $conversation->aiAgentSession()->first();
                        $context = is_array($session?->context ?? null)
                            ? $session->context
                            : [];

                        $wasHandoff =
                            array_key_exists('support_handoff_started_at', $context) ||
                            array_key_exists('support_handoff_active', $context) ||
                            array_key_exists('support_handoff_resolved_at', $context);

                        if ($session && $wasHandoff) {
                            if (!empty($context['support_handoff_active'])) {
                                $context['support_handoff_active'] = false;
                                $context['support_handoff_resolved_at'] = $context['support_handoff_resolved_at'] ?? now()->toISOString();
                                $context['support_handoff_resolved_by'] = Auth::id();
                                $session->context = $context;
                                $session->save();
                            }

                            // Restore AI assignment on conversation
                            $conversation->update([
                                'assigned_to' => Conversation::ASSIGNED_BOT,
                                'assignee_id' => null,
                                'assigned_at' => null,
                                'ai_agent_involved' => true,
                            ]);
                        }
                    } catch (\Throwable $_) {
                        // best-effort only per conversation
                    }
                }
            }
        } catch (\Throwable $_) {
            // best-effort only
        }

        return $this->success();
    }
}
