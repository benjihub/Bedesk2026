<?php

namespace Ai\AiAgent\Conversations;

class AIClassifierManager
{
    public function __construct(
        private ?AIClientService $client = null,
        private ?AIParsingManager $parser = null,
    ) {
        $this->client ??= new AIClientService();
        $this->parser ??= new AIParsingManager();
    }

    /**
     * Classify the answer to:
     * "Is the registered account name different from the transfer name?"
     *
     * Returns true for different, false for same, and null for unclear.
     */
    public function classifyDiffNameReplyWithLlm(string $text, ?array $context = null): ?bool
    {
        $apiKey = config('services.openai.api_key') ?? env('OPENAI_API_KEY');
        if (!$apiKey) {
            return null;
        }

        $system = 'You classify user replies for a binary support question. '
            . 'Question context: "Is the registered account name different from the transfer name?" '
            . 'Return JSON ONLY with keys: decision, confidence. '
            . 'decision must be one of: "different", "same", "unclear". '
            . 'confidence must be a number 0-1. '
            . 'Do not include markdown or extra text.';

        $user = 'User reply: "' . $text . "\"\n\n"
            . 'Interpret intent semantically, including slang/typos. '
            . 'Examples: "sama kok" => same, "beda" => different, '
            . '"nama rekening orang lain" => different.';

        try {
            $messages = [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user],
            ];

            $raw = $this->client->callOpenAiChatCompletion($messages, 0.0, 80, $context);
            $parsed = $this->parser->tryParseJson((string) $raw);
            if (!is_array($parsed)) {
                return null;
            }

            $decision = isset($parsed['decision']) && is_string($parsed['decision'])
                ? trim(mb_strtolower((string) $parsed['decision']))
                : '';
            $confidence = isset($parsed['confidence']) && is_numeric($parsed['confidence'])
                ? max(0.0, min(1.0, (float) $parsed['confidence']))
                : 0.0;

            // Require moderate confidence to avoid random misroutes.
            if ($confidence < 0.55) {
                return null;
            }

            if ($decision === 'different') return true;
            if ($decision === 'same') return false;
            return null;
        } catch (\Throwable $_) {
            return null;
        }
    }
}
