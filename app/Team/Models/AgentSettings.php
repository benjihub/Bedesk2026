<?php

namespace App\Team\Models;

use Illuminate\Database\Eloquent\Model;

class AgentSettings extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'assignment_limit' => 'integer',
        'working_hours' => 'json',
        'accepts_conversations' => 'string',
        'user_id' => 'integer',
    ];

    public static function newFromDefault(): static
    {
        return new static([
            'assignment_limit' => 5,
            'accepts_conversations' => 'yes',
            'working_hours' => null,
        ]);
    }
}
