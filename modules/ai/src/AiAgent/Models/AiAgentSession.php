<?php

namespace Ai\AiAgent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Conversations\Models\Conversation;

class AiAgentSession extends Model
{
    protected $table = 'ai_agent_sessions';

    public const MODEL_TYPE = 'aiAgentSession';

    // session statuses used by greeting and flow previews
    public const STATUS_ACTIVE = 'active';
    public const STATUS_WAITING_FOR_USER_INPUT = 'waiting_for_user_input';

    protected $guarded = [];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'context' => 'array',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Start or create a session for a conversation.
     * Returns the created or existing session.
     */
    public static function start(Conversation $conversation, $flowId = null, $status = self::STATUS_ACTIVE, $currentNodeId = null): self
    {
        $session = static::firstOrCreate(
            ['conversation_id' => $conversation->id],
            [
                'status' => $status,
                'context' => [
                    'flow_id' => $flowId,
                    'current_node_id' => $currentNodeId,
                ],
            ]
        );

        // ensure context keys are set/merged
        $session->context = array_merge($session->context ?? [], [
            'flow_id' => $flowId,
            'current_node_id' => $currentNodeId,
        ]);
        $session->status = $status;
        $session->save();

        return $session;
    }

    public static function pinAgentForConversation(
        Conversation $conversation,
        int|null $agentId = null,
    ): AiAgent|null {
        $agent = static::resolveAgentForConversation($conversation, $agentId);

        if (!$agent) {
            return null;
        }

        $session = static::firstOrCreate(
            ['conversation_id' => $conversation->id],
            ['status' => self::STATUS_ACTIVE, 'context' => []],
        );
        $context = is_array($session->context ?? null) ? $session->context : [];
        $context['ai_agent_id'] = $agent->id;
        $context['ai_agent_name'] = $agent->name;
        $session->context = $context;
        $session->save();

        return $agent;
    }

    public static function resolveAgentForConversation(
        Conversation $conversation,
        int|null $agentId = null,
    ): AiAgent|null {
        $groupId = $conversation->group_id ? (int) $conversation->group_id : null;

        if ($agentId) {
            return AiAgent::query()
                ->where('id', $agentId)
                ->where(function ($query) use ($groupId) {
                    if ($groupId) {
                        $query->whereNull('group_id')->orWhere('group_id', $groupId);
                    } else {
                        $query->whereNull('group_id');
                    }
                })
                ->first();
        }

        $query = AiAgent::query()->where('enabled', true);

        if ($groupId) {
            $groupAgent = (clone $query)
                ->where('group_id', $groupId)
                ->orderBy('id')
                ->first();

            if ($groupAgent) {
                return $groupAgent;
            }
        }

        return $query
            ->whereNull('group_id')
            ->orderBy('id')
            ->first();
    }
}
