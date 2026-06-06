<?php

namespace App\Team\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class GroupRotationState extends Model
{
    public $timestamps = true;

    protected $guarded = ['id'];

    protected $casts = [
        'group_id' => 'integer',
        'current_agent_index' => 'integer',
    ];

    public static function getOrCreateLockedForGroup(int $groupId): self
    {
        DB::table('group_rotation_states')->insertOrIgnore([
            'group_id' => $groupId,
            'current_agent_index' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return static::query()
            ->where('group_id', $groupId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    public static function getNextAgentIndexAndIncrement(
        int $groupId,
        int $eligibleAgentCount,
    ): int {
        return DB::transaction(function () use ($groupId, $eligibleAgentCount) {
            $state = static::getOrCreateLockedForGroup($groupId);

            $currentIndex = $state->current_agent_index;
            $nextIndex = ($currentIndex + 1) % max(1, $eligibleAgentCount);

            $state->update(['current_agent_index' => $nextIndex]);

            return $currentIndex;
        });
    }
}
