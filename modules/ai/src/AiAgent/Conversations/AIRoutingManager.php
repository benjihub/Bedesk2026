<?php

namespace Ai\AiAgent\Conversations;

class AIRoutingManager
{
    public function __construct(
        private ?AIClientService $client = null,
        private ?AIParsingManager $parser = null,
    ) {
        $this->client ??= new AIClientService();
        $this->parser ??= new AIParsingManager();
    }

    public function parseAssistantReply(array $messages, ?string $intent = null, ?array $context = null): array
    {
        $raw = $this->client->callOpenAiChatCompletion($messages, 0.2, 400, $context);

        $parsed = $this->parser->tryParseJson($raw);
        if (!is_array($parsed) || !array_key_exists('reply', $parsed) || !is_string($parsed['reply']) || trim($parsed['reply']) === '') {
            $rawTrim = trim($this->parser->stripMarkdownCodeFences((string) $raw));

            // If the model returned a JSON envelope (often wrapped in ```json),
            // do NOT echo it back to the user. Instead, fall back to a safe message.
            if ($rawTrim !== '') {
                if ($this->parser->looksLikeJsonEnvelope($rawTrim)) {
                    $parsed = [
                        'reply' => 'Maaf ya, aku lagi cek dulu. Boleh tunggu sebentar? 🙏',
                        'intent' => $intent ?: 'general',
                    ];
                } else {
                    $parsed = ['reply' => $rawTrim];
                }
            } else {
                // retry once like Chat Buddy
                $retry = $this->client->callOpenAiChatCompletion($messages, 0.3, 4000, $context);
                $retryTrim = trim($this->parser->stripMarkdownCodeFences((string) $retry));
                if ($retryTrim !== '') {
                    $retryParsed = $this->parser->tryParseJson($retry);
                    if (
                        is_array($retryParsed)
                        && array_key_exists('reply', $retryParsed)
                        && is_string($retryParsed['reply'])
                        && trim($retryParsed['reply']) !== ''
                    ) {
                        $parsed = $retryParsed;
                    } elseif ($this->parser->looksLikeJsonEnvelope($retryTrim)) {
                        $parsed = [
                            'reply' => 'Maaf ya, aku lagi cek dulu. Boleh tunggu sebentar? 🙏',
                            'intent' => $intent ?: 'general',
                        ];
                    } else {
                        $parsed = ['reply' => $retryTrim];
                    }
                }
            }
        }

        return is_array($parsed) ? $parsed : [];
    }

    /**
     * Use a lightweight LLM call to normalize noisy user input (typos/slang)
     * and get a coarse intent + routing hint. On any failure we fall back to
     * the original text and a non-operational route.
     */
    public function normalizeUserInputForRouting(string $text, ?array $context = null): array
    {
        $raw = trim($text);
        if ($raw === '') {
            return $this->fallbackRoute($text);
        }

        $system = 'You normalize short chat messages in Bahasa Indonesia for a casino customer support assistant. '
            . 'Always output small JSON ONLY with keys: "normalized_text" (string), "coarse_intent" '
            . '(one of: deposit, withdraw, turnover, promo, promo_claim, password_reset, qris, games, rtp, smalltalk, anger, unclear, other), '
            . '"route" ("operational" or "general"), and "confidence" (number 0-1). '
            . 'Do not include explanations, markdown, or extra keys. '
            . 'Messages about lupa akun, lupa password, tidak bisa login, atau minta bantuan akses akun '
            . '(for example: "Tlong bntu lupa akun") MUST use coarse_intent = "password_reset" and route = "operational". '
            . 'Messages indicating a mistaken or cancelled deposit (for example: "tolong batalkan deposit", "cancel deposit", "batal deposito") MUST use coarse_intent = "deposit" and route = "operational".';

        $user = "Pesan user: \"{$raw}\"\n\n"
            . '1) Tulis ulang pesan tersebut menjadi kalimat yang jelas dan natural dalam Bahasa Indonesia, tanpa mengubah maksud utama. '
            . '2) Tentukan coarse_intent berdasarkan maksud utama (misalnya deposit, withdraw, turnover, promo, promo_claim, password_reset, qris, games, rtp, smalltalk, anger, unclear, other). '
            . '3) route = "operational" HANYA jika user jelas minta cek / proses akun (deposit/withdraw/turnover/password_reset/qris/promo_claim). '
            . 'Kalau masih ngobrol biasa / belum jelas masalahnya, set route = "general". '
            . '4) confidence = seberapa yakin kamu, antara 0 dan 1.';

        try {
            $messages = [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user],
            ];

            $rawResp = $this->client->callOpenAiChatCompletion($messages, 0.1, 200, $context);
            $parsed = $this->parser->tryParseJson((string) $rawResp);
            if (!is_array($parsed)) {
                return $this->fallbackRoute($text);
            }

            $normalized = isset($parsed['normalized_text']) && is_string($parsed['normalized_text']) && trim($parsed['normalized_text']) !== ''
                ? trim((string) $parsed['normalized_text'])
                : $text;

            $coarse = isset($parsed['coarse_intent']) && is_string($parsed['coarse_intent']) && trim($parsed['coarse_intent']) !== ''
                ? trim(mb_strtolower((string) $parsed['coarse_intent']))
                : 'other';

            $route = isset($parsed['route']) && is_string($parsed['route']) && in_array($parsed['route'], ['operational','general'], true)
                ? $parsed['route']
                : 'general';

            $confidence = isset($parsed['confidence']) && is_numeric($parsed['confidence'])
                ? max(0.0, min(1.0, (float) $parsed['confidence']))
                : 0.0;

            return [
                'normalized_text' => $normalized,
                'coarse_intent' => $coarse,
                'route' => $route,
                'confidence' => $confidence,
            ];
        } catch (\Throwable $_) {
            return $this->fallbackRoute($text);
        }
    }

    private function fallbackRoute(string $text): array
    {
        return [
            'normalized_text' => $text,
            'coarse_intent' => 'other',
            'route' => 'general',
            'confidence' => 0.0,
        ];
    }
}
