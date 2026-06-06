<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEnginePromotionsTest extends TestCase
{
    public function test_compose_system_prompt_includes_promotions_list()
    {
        $conversation = new Conversation();
        $conversation->id = 20000;

        $engine = new GroupReplyEngine($conversation);

        $s = [
            'promotions' => [
                ['id' => 1, 'title' => 'Promo A', 'description' => 'desc'],
                ['id' => 2, 'title' => 'Promo B', 'description' => 'desc'],
            ],
            'brandName' => 'TestBrand',
            'rtpLink' => 'https://example',
        ];

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('composeSystemPromptFull');
        $method->setAccessible(true);

        $prompt = $method->invokeArgs($engine, [$s]);

        $this->assertStringContainsString('Promo A', $prompt);
        $this->assertStringContainsString('Promo B', $prompt);
        $this->assertStringContainsString('CURRENT PROMOTIONS', $prompt);
    }
}
