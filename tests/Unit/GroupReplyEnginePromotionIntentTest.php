<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEnginePromotionIntentTest extends TestCase
{
    public function test_promotion_question_returns_titles_only_list()
    {
        $conversation = new Conversation();
        $conversation->id = 30000;

        $engine = new GroupReplyEngine($conversation);

        // Prepare aiSettings with promotions
        $aiSettings = [
            'promotions' => [
                ['id' => 1, 'title' => 'Promo A', 'description' => 'desc'],
                ['id' => 2, 'title' => 'Promo B', 'description' => 'desc'],
            ],
        ];

        // Call private method buildReply via reflection
        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('buildReply');
        $method->setAccessible(true);

        $params = [
            'text' => 'promo apa ada?',
            'aiSettings' => $aiSettings,
            'intent' => null,
            'systemPrompt' => '',
            'messages' => null,
            'groupId' => '',
        ];

        $result = $method->invokeArgs($engine, [$params]);

        $this->assertArrayHasKey('reply', $result);
        $this->assertArrayHasKey('intent', $result);
        $this->assertSame('promotion', $result['intent']);

        $reply = (string) $result['reply'];
        $lines = preg_split('/\r?\n/', trim($reply));
        $this->assertCount(2, $lines);
        $this->assertSame('1. Promo A', $lines[0]);
        $this->assertSame('2. Promo B', $lines[1]);
    }
}
