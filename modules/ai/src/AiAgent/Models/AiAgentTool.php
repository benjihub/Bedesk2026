<?php

namespace Ai\AiAgent\Models;

use App\Team\Models\Group;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAgentTool extends Model
{
    protected $table = 'ai_agent_tools';

    protected $fillable = [
        'group_id',
        'name',
        'description',
        'active',
        'type',
        'activation_count',
        'allow_direct_use',
        'config',
        'response_schema',
        'live_response',
        'example_response',
    ];

    protected $casts = [
        'group_id' => 'integer',
        'active' => 'boolean',
        'allow_direct_use' => 'boolean',
        'activation_count' => 'integer',
        'config' => 'array',
        'response_schema' => 'array',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function getConfigAttribute($value)
    {
        $config = $value;

        if (is_string($config) && $config !== '') {
            $decoded = json_decode($config, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $config = $decoded;
            }
        }

        if (!is_array($config)) {
            $config = [];
        }

        if (!array_key_exists('selectedResponseType', $config)) {
            $config['selectedResponseType'] = 'live';
        }

        if (!array_key_exists('apiRequest', $config) || !is_array($config['apiRequest'])) {
            $config['apiRequest'] = [];
        }

        $config['apiRequest'] = array_merge(
            [
                'url' => '',
                'method' => 'GET',
                'headers' => [],
                'bodyType' => 'json',
                'body' => '',
                'collectedData' => [],
                'attributesUsed' => [],
            ],
            $config['apiRequest'],
        );

        return $config;
    }

    public function setConfigAttribute($value)
    {
        $this->attributes['config'] = json_encode($value ?? []);
    }

    public function getResponseSchemaAttribute($value)
    {
        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $value = $decoded;
            }
        }

        return is_array($value) ? $value : ['arrays' => [], 'properties' => []];
    }

    public function setResponseSchemaAttribute($value)
    {
        $this->attributes['response_schema'] = json_encode($value ?? []);
    }
}
