<?php

namespace App\Team\Traits;

use App\Team\Models\AgentSettings;
use App\Team\Models\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasOne;

trait CanBeAgent
{
    public function isSuperAdmin(): bool
    {
        return $this->hasPermission('superAdmin') ||
            $this->hasPermission('admin');
    }

    public function isAgent(): bool
    {
        return $this->type === 'agent';
    }

    public function agentSettings(): HasOne
    {
        return $this->hasOne(AgentSettings::class);
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_user');
    }

    public function wasActiveRecently(int $seconds = 300): bool
    {
        if (!$this->latestUserSession) {
            return false;
        }
        return $this->latestUserSession->updated_at->diffInSeconds(now()) <
            $seconds;
    }

    public function scopeWhereAgent(Builder $query): Builder
    {
        return $query->where('type', 'agent');
    }

    public function scopeWithActiveAssignedConversationsCount(
        Builder $query,
    ): Builder {
        return $query->withCount([
            'assignedConversations as active_assigned_conversations_count' => fn(
                $query,
            ) => $query
                ->whereNotClosed(),
        ]);
    }

    public function toCompactAgentArray(): array
    {
        if ($this->hasPermission('admin')) {
            $role = ['name' => 'super admin'];
        } elseif ($this->roles->first()) {
            $role = [
                'id' => $this->roles->first()->id,
                'name' => $this->roles->first()->name,
            ];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->email,
            'image' => $this->image,
            'role' => $role ?? null,
            'model_type' => $this::MODEL_TYPE,
        ];
    }

    public function acceptsConversations(): bool
    {
        if (!$this->id) {
            return false;
        }

        if ($this->banned_at !== null) {
            return false;
        }

        // not accepting conversations at all
        if ($this->agentSettings?->accepts_conversations === 'no') {
            return false;
        }

        // over assignment limit
        $assignmentLimit = $this->agentSettings?->assignment_limit ?? 5;
        if (
            $this->active_assigned_conversations_count &&
            $assignmentLimit <= $this->active_assigned_conversations_count
        ) {
            return false;
        }

        // working hours
        if (
            $this->agentSettings?->accepts_conversations === 'workingHours' &&
            $this->agentSettings?->working_hours
        ) {
            $hours =
                $this->agentSettings->working_hours[now()->isoWeekday()] ??
                null;

            // if hours for this day are not set at all or
            // current time is outside the range, return false
            if ($hours && isset($hours['from']) && isset($hours['to'])) {
                $start = now($this->timezone)->setTimeFromTimeString(
                    $hours['from'],
                );
                $end = now($this->timezone)->setTimeFromTimeString(
                    $hours['to'],
                );

                if (now()->between($start, $end)) {
                    return true;
                }
            }

            return false;
        }

        return true;
    }
}
