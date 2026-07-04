<?php

namespace Tests\Feature;

use Ai\AiAgent\Models\AiAgent;
use App\Models\User;
use App\Team\Models\Group;
use Common\Auth\Permissions\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiAgentsGroupScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_scoped_agent_is_visible_when_group_filter_is_used(): void
    {
        $group = Group::query()->firstOrCreate(['name' => 'Support']);

        $this->actingAs($this->createAiAgentUser(), 'sanctum')
            ->postJson('api/v1/lc/ai-agent/agents', [
                'groupId' => $group->id,
                'name' => 'Support Bot',
                'enabled' => true,
                'personality' => 'friendly',
                'greeting_type' => 'basicGreeting',
                'basic_greeting_message' => 'Hello!',
            ])
            ->assertCreated()
            ->assertJsonPath('agent.group_id', $group->id);

        $this->getJson("api/v1/lc/ai-agent/agents?groupId={$group->id}")
            ->assertOk()
            ->assertJsonPath('pagination.data.0.name', 'Support Bot');

        $this->getJson('api/v1/lc/ai-agent/agents')
            ->assertOk()
            ->assertJsonPath('pagination.data.0.name', 'Support Bot');

        $this->assertDatabaseHas('ai_agents', [
            'group_id' => $group->id,
            'name' => 'Support Bot',
        ]);
    }

    private function createAiAgentUser(): User
    {
        $user = User::create([
            'name' => 'AI Agent Creator',
            'email' => 'ai-agent-creator-'.str_replace('.', '', uniqid('', true)).'@example.test',
            'password' => 'password',
            'type' => 'agent',
            'email_verified_at' => now(),
        ]);

        $permissionIds = collect(['ai_agent.update', 'api.access'])
            ->map(fn(string $name) => Permission::firstOrCreate(
                ['name' => $name],
                ['type' => 'users'],
            )->id)
            ->all();

        $user->permissions()->syncWithoutDetaching($permissionIds);
        $user->load('permissions');

        return $user;
    }
}
