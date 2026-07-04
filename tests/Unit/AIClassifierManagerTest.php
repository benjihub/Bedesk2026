<?php

namespace Tests\Unit;

use Ai\AiAgent\Conversations\AIClassifierManager;
use Ai\AiAgent\Conversations\AIClientService;
use Tests\TestCase;

class AIClassifierManagerTest extends TestCase
{
    public function test_diff_name_classifier_returns_true_for_different(): void
    {
        config(['services.openai.api_key' => 'test-key']);

        $manager = new AIClassifierManager($this->fakeClient('{"decision":"different","confidence":0.9}'));

        $this->assertTrue($manager->classifyDiffNameReplyWithLlm('nama rekening orang lain'));
    }

    public function test_diff_name_classifier_returns_false_for_same(): void
    {
        config(['services.openai.api_key' => 'test-key']);

        $manager = new AIClassifierManager($this->fakeClient('{"decision":"same","confidence":0.8}'));

        $this->assertFalse($manager->classifyDiffNameReplyWithLlm('sama kok'));
    }

    public function test_diff_name_classifier_requires_confidence(): void
    {
        config(['services.openai.api_key' => 'test-key']);

        $manager = new AIClassifierManager($this->fakeClient('{"decision":"different","confidence":0.4}'));

        $this->assertNull($manager->classifyDiffNameReplyWithLlm('mungkin beda'));
    }

    public function test_diff_name_classifier_skips_llm_without_api_key(): void
    {
        config(['services.openai.api_key' => '']);

        $manager = new AIClassifierManager($this->fakeClient('{"decision":"different","confidence":0.9}'));

        $this->assertNull($manager->classifyDiffNameReplyWithLlm('beda'));
    }

    private function fakeClient(string $response): AIClientService
    {
        return new class($response) extends AIClientService {
            public function __construct(private string $response) {}

            public function callOpenAiChatCompletion(array $messages, float $temperature, int $maxTokens): string
            {
                return $this->response;
            }
        };
    }
}
