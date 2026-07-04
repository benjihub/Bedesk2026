<?php

namespace Tests\Unit;

use Ai\AiAgent\Conversations\AIUserIdFlowManager;
use App\Conversations\Models\Conversation;
use Tests\TestCase;

class AIUserIdFlowManagerTest extends TestCase
{
    public function test_extract_user_id_from_explicit_label(): void
    {
        $manager = new AIUserIdFlowManager(new Conversation());

        $this->assertSame('abc123', $manager->extractUserId('user id: abc123'));
    }

    public function test_extract_user_id_ignores_common_greeting(): void
    {
        $manager = new AIUserIdFlowManager(new Conversation());

        $this->assertNull($manager->extractUserId('halo'));
    }

    public function test_resolve_wait_message_uses_custom_placeholder(): void
    {
        $manager = new AIUserIdFlowManager(new Conversation());

        $message = $manager->resolveWaitMessage([
            'waitMessage' => 'User {{USER_ID}} sedang dicek.',
        ], 'abc123');

        $this->assertSame('User abc123 sedang dicek.', $message);
    }

    public function test_detect_user_id_flow_type_for_claim(): void
    {
        $manager = new AIUserIdFlowManager(new Conversation());

        $this->assertSame('claim', $manager->detectUserIdFlowType('Saya ingin klaim bonus'));
    }
}
