<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEngineTurnoverOverrideTest extends TestCase
{
    public function test_resolve_turnover_override_applies()
    {
        $conversation = new Conversation();
        $conversation->id = 60000;

        $engine = new GroupReplyEngine($conversation);

        $aiSettings = [
            'userIdRequestTemplates' => [
                'turnover' => 'Custom turnover template. Provide USER ID.',
            ],
        ];

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('resolveUserIdRequestMessage');
        $method->setAccessible(true);

        $result = $method->invokeArgs($engine, ['turnover', $aiSettings]);

        $this->assertSame('Custom turnover template. Provide USER ID.', $result);
    }

    public function test_detectUserIdFlowType_turnover()
    {
        $conversation = new Conversation();
        $conversation->id = 60001;

        $engine = new GroupReplyEngine($conversation);

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('detectUserIdFlowType');
        $method->setAccessible(true);

        $this->assertSame('turnover', $method->invokeArgs($engine, ['TO saya sudah berapa?']));
        $this->assertSame('turnover', $method->invokeArgs($engine, ['cek rollover bonus saya']));
    }
}
