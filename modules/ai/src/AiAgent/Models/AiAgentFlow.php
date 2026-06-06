<?php

namespace Ai\AiAgent\Models;

use App\Team\Models\Group;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class AiAgentFlow extends Model
{
    protected $table = 'ai_agent_flows';

    protected $fillable = [
        'group_id',
        'name',
        'description',
        'config',
    ];

    protected $casts = [
        'group_id' => 'integer',
        'config' => 'array',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function getConfigAttribute($value)
    {
        // when null or empty, ensure we return a safe default structure expected by frontend
        $config = $value;
        // if stored as JSON string (raw attribute), decode it
        if (is_string($config) && $config !== '') {
            $decoded = json_decode($config, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $config = $decoded;
            }
        }
        if (is_null($config)) {
            return ['nodes' => []];
        }

        if (is_array($config)) {
            if (!array_key_exists('nodes', $config) || $config['nodes'] === null) {
                $config['nodes'] = [];
            }
            return $config;
        }

        return ['nodes' => []];
    }

    public function setConfigAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['config'] = json_encode(['nodes' => []]);
            return;
        }

        $this->attributes['config'] = json_encode($value);
    }
}
