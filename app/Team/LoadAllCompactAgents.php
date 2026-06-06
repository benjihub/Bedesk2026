<?php

namespace App\Team;

use App\Models\User;
use Illuminate\Support\Collection;

class LoadAllCompactAgents
{
    public function execute(): Collection
    {
        return User::whereAgent()
            ->with(['agentSettings', 'groups', 'latestUserSession'])
            ->withActiveAssignedConversationsCount()
            ->get()
            ->map(function (User $agent) {
                return [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'image' => $agent->image,
                    'wasActiveRecently' => $agent->wasActiveRecently(),
                    'activeDate' => $agent->latestUserSession?->updated_at,
                    'acceptsConversations' => $agent->acceptsConversations(),
                    'activeAssignedConversationsCount' =>
                        $agent->active_assigned_conversations_count,
                    'groups' => $agent->groups->map->only(['id', 'name']),
                ];
            });
    }
}
