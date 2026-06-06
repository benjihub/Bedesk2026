<?php

namespace Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Models\AiAgentSession;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEngineWaitMessageTest extends TestCase
{
    use RefreshDatabase;

    // simple subclass that avoids calling OpenAI during tests
    private function makeEngine(Conversation $conversation)
    {
        return new class($conversation) extends GroupReplyEngine {
            public function normalizeUserInputForRouting(string $text): array
            {
                // always treat as deposit operational so we can reach deposit logic
                return [
                    'normalized_text' => $text,
                    'coarse_intent' => 'deposit',
                    'route' => 'operational',
                    'confidence' => 1.0,
                ];
            }
        };
    }

    public function test_resolve_wait_message_uses_override_when_present()
    {
        $conversation = new Conversation();
        $conversation->id = 40000;

        $engine = new GroupReplyEngine($conversation);

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('resolveWaitMessage');
        $method->setAccessible(true);

        $aiSettings = [
            'waitMessage' => 'Custom wait: Please hold, {{USER_ID}} is being checked.',
        ];

        $result = $method->invokeArgs($engine, [$aiSettings, 'theuserid']);
        $this->assertStringContainsString('Custom wait', $result);
        $this->assertStringContainsString('theuserid', $result);
    }

    public function test_cancel_deposit_triggers_wait_and_processing()
    {
        $conversation = new Conversation();
        $conversation->id = 40002;

        $engine = $this->makeEngine($conversation);
        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('buildReply');
        $method->setAccessible(true);

        $params = [
            'text' => 'tolong batalkan deposit',
            'aiSettings' => [],
        ];

        $result = $method->invokeArgs($engine, [$params]);

        $this->assertEquals('processing', $result['intent']);
        $this->assertTrue($result['context']['processing']);
        $this->assertFalse($result['context']['awaitingUserId'] ?? false, 'should not be waiting for a USER ID');
        $this->assertStringContainsString('tunggu', strtolower($result['reply']));
    }

    public function test_cancel_deposit_mid_flow_also_skips_userid()
    {
        $conversation = Conversation::factory()->create();
        AiAgentSession::create([
            'conversation_id' => $conversation->id,
            'status' => AiAgentSession::STATUS_ACTIVE,
            'context' => ['deposit_check' => ['stage' => 'awaiting_proof', 'last_status' => null]],
        ]);

        $engine = $this->makeEngine($conversation);
        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('buildReply');
        $method->setAccessible(true);

        $params = [
            'text' => 'batalin depo',
            'aiSettings' => [],
        ];

        $result = $method->invokeArgs($engine, [$params]);

        $this->assertEquals('processing', $result['intent']);
        $this->assertTrue($result['context']['processing']);
        $this->assertFalse($result['context']['awaitingUserId'] ?? false);
        $this->assertStringContainsString('tunggu', strtolower($result['reply']));
    }

    public function test_resolve_wait_message_defaults_when_no_override()
    {
        $conversation = new Conversation();
        $conversation->id = 40001;

        $engine = new GroupReplyEngine($conversation);

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('resolveWaitMessage');
        $method->setAccessible(true);

        $aiSettings = [];

        $result = $method->invokeArgs($engine, [$aiSettings, 'abc123']);
        $this->assertStringContainsString('tunggu', strtolower($result));
    }
}
