<?php

namespace Ai\AiAgent\Models;

use App\Conversations\Models\Conversation;
use App\Team\Models\Group;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAgentActivityLog extends Model
{
    protected $table = 'ai_agent_activity_logs';

    protected $fillable = [
        'group_id',
        'ai_agent_id',
        'conversation_id',
        'agent_name',
        'status',
        'response_time_ms',
        'prompt_tokens',
        'completion_tokens',
        'total_tokens',
        'error_message',
    ];

    protected $casts = [
        'group_id' => 'integer',
        'ai_agent_id' => 'integer',
        'conversation_id' => 'integer',
        'response_time_ms' => 'integer',
        'prompt_tokens' => 'integer',
        'completion_tokens' => 'integer',
        'total_tokens' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(AiAgent::class, 'ai_agent_id');
    }
}
