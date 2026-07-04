<?php

namespace Tests\Unit;

use Ai\AiAgent\Conversations\AISoftSellManager;
use App\Conversations\Models\Conversation;
use Tests\TestCase;

class AISoftSellManagerTest extends TestCase
{
    public function test_rewrite_soft_sell_returns_null_for_empty_original(): void
    {
        $manager = new AISoftSellManager(new Conversation());

        $this->assertNull($manager->rewriteSoftSellUsingLlm('   '));
    }

    public function test_rewrite_soft_sell_uses_local_template_without_api_key(): void
    {
        config(['services.openai.api_key' => '']);

        $manager = new AISoftSellManager(new Conversation());

        $reply = $manager->rewriteSoftSellUsingLlm('Ayo deposit sekarang', [], 'promo apa?');

        $this->assertIsString($reply);
        $this->assertNotSame('', trim($reply));
        $this->assertDoesNotMatchRegularExpression('/\b(sekarang|segera|langsung|klik|gabung|daftar)\b/ui', $reply);
    }
}
