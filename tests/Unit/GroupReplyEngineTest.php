<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEngineTest extends TestCase
{
    public function test_resolve_password_reset_override_applies()
    {
        $conversation = new Conversation();
        $conversation->id = 9999; // no DB persistence required for this unit test

        $engine = new GroupReplyEngine($conversation);

        $aiSettings = [
            'userIdRequestTemplates' => [
                'password_reset' => 'Custom password reset template. Please provide USER ID.',
            ],
        ];

        // Call private method via reflection
        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('resolveUserIdRequestMessage');
        $method->setAccessible(true);

        $result = $method->invokeArgs($engine, ['password_reset', $aiSettings]);

        $this->assertSame('Custom password reset template. Please provide USER ID.', $result);
    }

    public function test_resolve_password_reset_without_override_uses_default()
    {
        $conversation = new Conversation();
        $conversation->id = 10000;

        $engine = new GroupReplyEngine($conversation);

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('resolveUserIdRequestMessage');
        $method->setAccessible(true);

        // No overrides
        $result = $method->invokeArgs($engine, ['password_reset', []]);

        $this->assertStringContainsString('reset password', strtolower($result));
    }
}
