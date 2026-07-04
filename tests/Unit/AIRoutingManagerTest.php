<?php

namespace Tests\Unit;

use Ai\AiAgent\Conversations\AIClientService;
use Ai\AiAgent\Conversations\AIRoutingManager;
use Tests\TestCase;

class AIRoutingManagerTest extends TestCase
{
    public function test_parse_assistant_reply_parses_json_reply(): void
    {
        $manager = new AIRoutingManager($this->fakeClient('{"reply":"Siap bos","intent":"general"}'));

        $result = $manager->parseAssistantReply([
            ['role' => 'user', 'content' => 'halo'],
        ]);

        $this->assertSame('Siap bos', $result['reply']);
        $this->assertSame('general', $result['intent']);
    }

    public function test_parse_assistant_reply_does_not_echo_json_envelope_without_reply(): void
    {
        $manager = new AIRoutingManager($this->fakeClient('{"reply":"","intent":"deposit","context":{"processing":true}}'));

        $result = $manager->parseAssistantReply([
            ['role' => 'user', 'content' => 'cek deposit'],
        ], 'deposit');

        $this->assertSame('Maaf ya, aku lagi cek dulu. Boleh tunggu sebentar? 🙏', $result['reply']);
        $this->assertSame('deposit', $result['intent']);
    }

    public function test_parse_assistant_reply_retries_when_first_reply_is_empty(): void
    {
        $manager = new AIRoutingManager($this->fakeClient([
            '',
            '{"reply":"Aku cek dulu ya","intent":"deposit"}',
        ]));

        $result = $manager->parseAssistantReply([
            ['role' => 'user', 'content' => 'cek deposit'],
        ], 'deposit');

        $this->assertSame('Aku cek dulu ya', $result['reply']);
        $this->assertSame('deposit', $result['intent']);
    }

    public function test_parse_assistant_reply_uses_plain_text_fallback(): void
    {
        $manager = new AIRoutingManager($this->fakeClient('Siap, aku bantu cek ya.'));

        $result = $manager->parseAssistantReply([
            ['role' => 'user', 'content' => 'halo'],
        ]);

        $this->assertSame('Siap, aku bantu cek ya.', $result['reply']);
    }

    public function test_normalize_user_input_for_routing_clamps_confidence_and_route(): void
    {
        $manager = new AIRoutingManager($this->fakeClient(json_encode([
            'normalized_text' => 'Tolong bantu lupa password akun',
            'coarse_intent' => 'PASSWORD_RESET',
            'route' => 'operational',
            'confidence' => 2,
        ])));

        $result = $manager->normalizeUserInputForRouting('Tlong bntu lupa akun');

        $this->assertSame('Tolong bantu lupa password akun', $result['normalized_text']);
        $this->assertSame('password_reset', $result['coarse_intent']);
        $this->assertSame('operational', $result['route']);
        $this->assertSame(1.0, $result['confidence']);
    }

    public function test_normalize_user_input_for_routing_falls_back_on_bad_json(): void
    {
        $manager = new AIRoutingManager($this->fakeClient('not json'));

        $result = $manager->normalizeUserInputForRouting('halo');

        $this->assertSame('halo', $result['normalized_text']);
        $this->assertSame('other', $result['coarse_intent']);
        $this->assertSame('general', $result['route']);
        $this->assertSame(0.0, $result['confidence']);
    }

    private function fakeClient(string|array $response): AIClientService
    {
        return new class($response) extends AIClientService {
            private int $calls = 0;

            public function __construct(private string|array $response) {}

            public function callOpenAiChatCompletion(array $messages, float $temperature, int $maxTokens): string
            {
                if (is_array($this->response)) {
                    $response = $this->response[$this->calls] ?? end($this->response);
                    $this->calls++;

                    return (string) $response;
                }

                return $this->response;
            }
        };
    }
}
