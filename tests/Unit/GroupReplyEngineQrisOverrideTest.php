<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\GroupReplyEngine;

class GroupReplyEngineQrisOverrideTest extends TestCase
{
    public function test_resolve_qris_override_applies()
    {
        $conversation = new Conversation();
        $conversation->id = 61000;

        $engine = new GroupReplyEngine($conversation);

        $aiSettings = [
            'userIdRequestTemplates' => [
                'qris' => 'Custom QRIS template. Provide USER ID.',
            ],
        ];

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('resolveUserIdRequestMessage');
        $method->setAccessible(true);

        $result = $method->invokeArgs($engine, ['qris', $aiSettings]);

        $this->assertSame('Custom QRIS template. Provide USER ID.', $result);
    }

    public function test_detectUserIdFlowType_qris()
    {
        $conversation = new Conversation();
        $conversation->id = 61001;

        $engine = new GroupReplyEngine($conversation);

        $ref = new \ReflectionClass($engine);
        $method = $ref->getMethod('detectUserIdFlowType');
        $method->setAccessible(true);

        $this->assertSame('qris', $method->invokeArgs($engine, ['kode qris']));
        $this->assertSame('qris', $method->invokeArgs($engine, ['nomor qris saya 12345']));
    }
}
