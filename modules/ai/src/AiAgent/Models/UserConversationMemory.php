<?php

namespace Ai\AiAgent\Models;

use App\Team\Models\Group;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserConversationMemory extends Model
{
    protected $table = 'user_conversation_memories';

    protected $guarded = [];

    protected $casts = [
        'last_interaction_at' => 'datetime',
        'notes' => 'array',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public static function findFor(string $username, int $groupId): ?self
    {
        return static::where('username', $username)
            ->where('group_id', $groupId)
            ->first();
    }
}
