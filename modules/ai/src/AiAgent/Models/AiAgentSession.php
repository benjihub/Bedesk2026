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
}
