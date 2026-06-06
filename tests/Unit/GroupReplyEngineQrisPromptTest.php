<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEngineQrisPromptTest extends TestCase
{
    public function test_system_prompt_contains_qris_flow_rules()
    {
        $conversation = new Conversation();
        $conversation->id = 52000;

        $engine = new GroupReplyEngine($conversation);

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('composeSystemPromptFull');
        $method->setAccessible(true);

        $s = [
            'brandName' => 'TestBrand',
            'promotions' => [],
        ];

        $prompt = $method->invokeArgs($engine, [$s]);

        $this->assertStringContainsString('QRIS FLOW (ABSOLUTE LOCK)', $prompt);
        $this->assertStringContainsString('Immediately ask for the USER ID', $prompt);
        $this->assertStringContainsString('Do NOT attempt to process or validate payments in chat', $prompt);
        $this->assertStringContainsString('Wait message: "Mohon tunggu sebentar ya, sedang diproses 🙏"', $prompt);
    }
}
