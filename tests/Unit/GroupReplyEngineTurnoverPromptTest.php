<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEngineTurnoverPromptTest extends TestCase
{
    public function test_system_prompt_contains_turnover_flow_rules()
    {
        $conversation = new Conversation();
        $conversation->id = 51000;

        $engine = new GroupReplyEngine($conversation);

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('composeSystemPromptFull');
        $method->setAccessible(true);

        $s = [
            'brandName' => 'TestBrand',
            'promotions' => [],
        ];

        $prompt = $method->invokeArgs($engine, [$s]);

        $this->assertStringContainsString('TURNOVER FLOW (ABSOLUTE LOCK)', $prompt);
        $this->assertStringContainsString('Immediately ask for the USER ID', $prompt);
        $this->assertStringContainsString('Do NOT attempt to compute or validate turnover in chat', $prompt);
        $this->assertStringContainsString('Wait message: "Mohon tunggu sebentar ya, sedang diproses 🙏"', $prompt);
    }
}
