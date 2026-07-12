<?php

namespace Ai\AiAgent\Conversations;

use Ai\AiAgent\Models\AiAgentSession;
use App\Conversations\Models\Conversation;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class AISoftSellManager
{
    public function __construct(protected Conversation $conversation) {}

    public function rewriteSoftSellUsingLlm(string $original, array $aiSettings = [], string $userText = ''): ?string
    {
        $orig = trim($original);
        if ($orig === '') return null;

        $contextSnippet = trim((string) $userText);

        // Local safe templates (guaranteed non-pressuring). Used if LLM is unavailable or fails validation.
        $localTemplates = [
            "Hai! Kalau mau tanya tentang promo atau cara deposit, bilang aja ya — aku bantu santai kok. 🙌",
            "Hei, kalau butuh info promo atau cara deposit nanti aja bilang ya — aku bantu tanpa tekan.",
            "Kalau mau lihat promo atau cara deposit, tinggal bilang kapan pun — santai aja, aku bantu.",
            "Gak masalah kalau nggak mau bahas promo. Kalau butuh info, bilang aja ya — aku bantu santai.",
        ];

        // If OpenAI not configured, skip LLM attempt and use local template.
        $apiKey = config('services.openai.api_key') ?? env('OPENAI_API_KEY');
        if (!$apiKey) {
            try { Log::info('Soft-sell rewrite skipped: OpenAI API key not configured', ['conversation_id' => $this->conversation->id ?? null]); } catch (\Throwable $e) { }
            return $localTemplates[array_rand($localTemplates)];
        }

        // Build base system/user prompts for LLM rewrite attempts
        $baseSystem = "You are a helpful assistant that rewrites messages into a friendly, non-pressuring 'soft-sell' tone in Bahasa Indonesia. You MAY include ONE short non-pressuring sentence that explains how to deposit or offers step-by-step help. Always include a responsible gambling reminder and avoid pushy wording. " .
                      "Do NOT include any calls-to-action that encourage deposits, signups, clicking links, or spending. Never say you are a virtual assistant or a bot, always present yourself as a friendly human support agent." .
                      "Keep reply short (1-2 sentences), empathetic, and offer to provide more info only if the user asks. Never invent promo details or links.";

        $baseUser = "Rewrite the following reply into a short, friendly, non-pressuring reply in Bahasa Indonesia. " .
                    "Do NOT add any CTA or promotional pressure. Keep it conversational and suitable for a support chat.\n\nOriginal reply:\n" . $orig;
        if ($contextSnippet !== '') {
            $baseUser .= "\n\nAdditional context (user message): " . $contextSnippet;
        }

        $attempts = [
            ['temp' => 0.7, 'max' => 200, 'prompt' => $baseUser],
            // Stricter retry if first attempt contains CTAs
            ['temp' => 0.3, 'max' => 180, 'prompt' => "Rewrite the text to remove ANY language that can be perceived as a call-to-action or promotional push. Keep it neutral and friendly. Original reply:\n" . $orig],
        ];

        $ctaRegex = '/\b(bayar|deposit|isi\s*saldo|daftar|gabung|klik|segera|langsung|topup|top\s?up|beli|tarik\s*uang)\b/ui';

        foreach ($attempts as $i => $attempt) {
            try {
                $messages = [
                    ['role' => 'system', 'content' => $baseSystem],
                    ['role' => 'user', 'content' => $attempt['prompt']],
                ];
                $agentName = trim((string) Arr::get($aiSettings, 'name', 'AI assistant'));
                $agentName = $agentName !== '' ? $agentName : 'AI assistant';
                $resp = (new AIClientService())->callOpenAiChatCompletion(
                    $messages,
                    $attempt['temp'],
                    $attempt['max'],
                    [
                        'conversation_id' => $this->conversation->id,
                        'group_id' => $this->conversation->group_id ? (int) $this->conversation->group_id : null,
                        'ai_agent_id' => $this->pinnedAiAgentId(),
                        'agent_name' => $agentName,
                    ],
                );
                $rewritten = trim($this->stripMarkdownCodeFences((string) $resp));

                if ($rewritten === '') {
                    try { Log::info('Soft-sell rewrite attempt empty', ['attempt' => $i, 'conversation_id' => $this->conversation->id ?? null]); } catch (\Throwable $e) { }
                    continue; // try next attempt or fallback
                }

                // Validate rewritten text does not contain CTA keywords
                if (preg_match($ctaRegex, mb_strtolower($rewritten))) {
                    try { Log::info('Soft-sell rewrite contained CTA, rejecting', ['attempt' => $i, 'text' => mb_substr($rewritten,0,200), 'conversation_id' => $this->conversation->id ?? null]); } catch (\Throwable $e) { }
                    continue; // try next attempt or fallback
                }

                // Good rewrite
                try { Log::info('Soft-sell rewrite succeeded', ['attempt' => $i, 'conversation_id' => $this->conversation->id ?? null]); } catch (\Throwable $e) { }
                return $rewritten;
            } catch (\Throwable $e) {
                try { Log::warning('Soft-sell rewrite attempt failed', ['attempt' => $i, 'error' => $e->getMessage()]); } catch (\Throwable $ignored) { }
                continue;
            }
        }

        // Last-resort local template that can be slightly tailored based on user context
        $tailored = $localTemplates[array_rand($localTemplates)];
        if ($contextSnippet !== '') {
            // If user asked about games or RTP, reflect that without promoting deposits
            if (preg_match('/\b(promo|promosi|bonus)\b/ui', $contextSnippet)) {
                $tailored = "Ada beberapa promo aktif. Kalau mau lihat detailnya, bilang aja ya — aku bantu santai. 🙌";
            } elseif (preg_match('/\b(deposit|depo|topup|top up)\b/ui', $contextSnippet)) {
                $tailored = "Kalau mau tahu cara deposit, bilang aja kapan pun — aku bantu langkah demi langkah tanpa tekanan.";
            }
        }

        try { Log::info('Soft-sell rewrite falling back to local template', ['conversation_id' => $this->conversation->id ?? null]); } catch (\Throwable $e) { }
        return $tailored;
    }

    private function stripMarkdownCodeFences(string $text): string
    {
        $trimmed = trim($text);

        if (preg_match('/^```[a-z0-9_-]*\s*/i', $trimmed)) {
            $trimmed = preg_replace('/^```[a-z0-9_-]*\s*/i', '', $trimmed, 1) ?? $trimmed;
        }
        if (str_ends_with($trimmed, '```')) {
            $trimmed = substr($trimmed, 0, -3);
        }

        return trim($trimmed);
    }

    private function pinnedAiAgentId(): int|null
    {
        try {
            $session = AiAgentSession::query()
                ->where('conversation_id', $this->conversation->id)
                ->first();
            $context = is_array($session?->context ?? null) ? $session->context : [];
            $agentId = $context['ai_agent_id'] ?? null;

            return is_numeric($agentId) ? (int) $agentId : null;
        } catch (\Throwable $_) {
            return null;
        }
    }
}
