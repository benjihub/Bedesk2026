<?php

namespace Tests\Unit;

use Ai\AiAgent\Conversations\AIHandoffManager;
use Ai\AiAgent\Models\AiAgentSession;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Conversations\Models\TicketEventLog;
use Common\Tags\Tag;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AIHandoffManagerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_handoff_sets_lock_context_tag_and_event_log(): void
    {
        $conversation = $this->createBotTicket();

        (new AIHandoffManager($conversation))->handoffToSupportIfNeeded([
            'intent' => 'deposit',
            'context' => [
                'processing' => true,
                'userId' => 'player123',
            ],
        ], 'Mohon tunggu ya, sedang dicek.');

        $session = AiAgentSession::where('conversation_id', $conversation->id)->first();

        $this->assertTrue((bool) $session?->context['support_handoff_active']);
        $this->assertSame('deposit', $session->context['support_handoff_intent']);
        $this->assertSame('player123', $session->context['support_handoff_user_id']);

        $tag = Tag::where('name', 'need-human-support')->first();
        $this->assertNotNull($tag);
        $this->assertDatabaseHas('taggables', [
            'tag_id' => $tag->id,
            'taggable_id' => $conversation->id,
            'taggable_type' => Conversation::MODEL_TYPE,
        ]);
        $this->assertDatabaseHas('ticket_event_logs', [
            'conversation_id' => $conversation->id,
            'event_type' => TicketEventLog::EVENT_NEED_HUMAN_SUPPORT,
        ]);
    }

    public function test_handoff_resume_waits_for_lock_clear_and_then_clears_context(): void
    {
        $conversation = $this->createBotTicket([
            'assigned_to' => Conversation::ASSIGNED_AGENT,
        ]);
        $tag = Tag::firstOrCreate(
            ['name' => 'need-human-support'],
            ['display_name' => 'Need human support', 'type' => 'custom'],
        );
        $conversation->attachTag($tag->id);
        AiAgentSession::create([
            'conversation_id' => $conversation->id,
            'status' => AiAgentSession::STATUS_ACTIVE,
            'context' => [
                'support_handoff_active' => true,
                'support_handoff_intent' => 'deposit',
            ],
        ]);

        $manager = new AIHandoffManager($conversation);

        $this->assertFalse($manager->shouldResumeAfterHandoff());

        $conversation->detachTag($tag->id);
        $conversation->unsetRelation('tags');

        $this->assertTrue($manager->shouldResumeAfterHandoff());

        $manager->clearSupportHandoff();

        $context = AiAgentSession::where('conversation_id', $conversation->id)
            ->first()
            ->context;

        $this->assertArrayNotHasKey('support_handoff_active', $context);
        $this->assertArrayHasKey('support_handoff_finished_at', $context);
        $this->assertFalse(
            DB::table('taggables')
                ->where('tag_id', $tag->id)
                ->where('taggable_id', $conversation->id)
                ->where('taggable_type', Conversation::MODEL_TYPE)
                ->exists(),
        );
    }

    private function createBotTicket(array $overrides = []): Conversation
    {
        $status = ConversationStatus::create([
            'label' => 'Open',
            'user_label' => 'Open',
            'category' => Conversation::STATUS_OPEN,
            'active' => true,
            'internal' => true,
        ]);

        return Conversation::create([
            'subject' => 'AI handoff unit test',
            'type' => 'ticket',
            'status_id' => $status->id,
            'status_category' => $status->category,
            'assigned_to' => Conversation::ASSIGNED_BOT,
            'channel' => 'widget',
            'mode' => Conversation::MODE_NORMAL,
            ...$overrides,
        ]);
    }
}
