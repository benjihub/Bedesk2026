<?php

namespace Tests\Unit;

use Ai\AiAgent\Conversations\AIIntentManager;
use App\Conversations\Models\Conversation;
use Tests\TestCase;

class AIIntentManagerTest extends TestCase
{
    public function test_detect_intent_routes_promo_claim_to_user_id_collection(): void
    {
        $manager = new AIIntentManager(new Conversation());

        $this->assertSame('userid_collection', $manager->detectIntent('cara claim promo garansi kekalahan'));
    }

    public function test_detect_intent_identifies_rtp(): void
    {
        $manager = new AIIntentManager(new Conversation());

        $this->assertSame('rtp', $manager->detectIntent('link rtp dong'));
    }

    public function test_frustration_message_detects_deposit_complaint(): void
    {
        $manager = new AIIntentManager(new Conversation());

        $this->assertTrue($manager->isFrustrationMessage('deposit 3x gak masuk!!!'));
    }

    public function test_contains_approx_matches_small_typo(): void
    {
        $manager = new AIIntentManager(new Conversation());

        $this->assertTrue($manager->containsApprox(['klaim'], ['claim'], 2));
    }
}
