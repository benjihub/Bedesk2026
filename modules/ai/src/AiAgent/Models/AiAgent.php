<?php

namespace Ai\AiAgent\Models;

use App\Team\Models\Group;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiAgent extends Model
{
    protected $table = 'ai_agents';

    protected $fillable = [
        'group_id',
        'name',
        'image',
        'enabled',
        'personality',
        'greeting_type',
        'initial_flow_id',
        'basic_greeting_message',
        'basic_greeting_flow_ids',
        'transfer_instruction',
        'cant_assist_instruction',
    ];

    protected $casts = [
        'group_id' => 'integer',
        'enabled' => 'boolean',
        'basic_greeting_flow_ids' => 'array',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function flows()
    {
        return $this->hasMany(AiAgentFlow::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(AiAgentActivityLog::class, 'ai_agent_id');
    }
}
