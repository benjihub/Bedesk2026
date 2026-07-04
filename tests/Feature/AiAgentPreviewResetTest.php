<?php

namespace Tests\Feature;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use Common\Auth\Permissions\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiAgentPreviewResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_widget_page_loads_for_authenticated_agent(): void
    {
        $this->actingAs($this->createAiAgentUser())
            ->get('lc/widget/ai-agent-preview-mode')
            ->assertOk();
    }

    public function test_preview_reset_deletes_only_preview_conversation(): void
    {
        $status = $this->createOpenStatus();
        $conversation = Conversation::create([
            'subject' => 'Preview reset',
            'type' => 'ticket',
            'status_id' => $status->id,
            'status_category' => $status->category,
            'assigned_to' => Conversation::ASSIGNED_BOT,
            'channel' => 'widget',
            'mode' => Conversation::MODE_PREVIEW,
        ]);

        $this->actingAs($this->createAiAgentUser(), 'sanctum')
            ->deleteJson("api/v1/lc/ai-agent-preview/conversations/{$conversation->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('conversations', [
            'id' => $conversation->id,
        ]);
    }

    public function test_preview_reset_refuses_live_conversation(): void
    {
        $status = $this->createOpenStatus();
        $conversation = Conversation::create([
            'subject' => 'Live conversation',
            'type' => 'ticket',
            'status_id' => $status->id,
            'status_category' => $status->category,
            'assigned_to' => Conversation::ASSIGNED_BOT,
            'channel' => 'widget',
            'mode' => Conversation::MODE_NORMAL,
        ]);

        $this->actingAs($this->createAiAgentUser(), 'sanctum')
            ->deleteJson("api/v1/lc/ai-agent-preview/conversations/{$conversation->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
        ]);
    }

    private function createAiAgentUser(): User
    {
        $user = User::create([
            'name' => 'AI Preview Tester',
            'email' => 'ai-preview-tester-'.str_replace('.', '', uniqid('', true)).'@example.test',
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

    private function createOpenStatus(): ConversationStatus
    {
        return ConversationStatus::create([
            'label' => 'Open',
            'user_label' => 'Open',
            'category' => Conversation::STATUS_OPEN,
            'active' => true,
            'internal' => true,
        ]);
    }
}
