<?php

namespace Ai\AiAgent\Conversations;

use App\Conversations\Models\Conversation;
use Illuminate\Support\Facades\Log;

class AIGreetingAndPromptComposer
{
    private const DEFAULT_RTP_TEMPLATES = [
        'Anda dapat melihat rates RTP live dan informasi lengkapnya langsung di halaman resmi kami: {{RTP_LINK}}.',
        'Untuk informasi RTP yang paling akurat dan terkini, silakan kunjungi halaman RTP kami: {{RTP_LINK}}.',
        'Untuk membantu Anda membuat keputusan yang tepat, Anda dapat menemukan informasi RTP waktu nyata kami di tautan berikut: {{RTP_LINK}}.',
    ];

    private const SYSTEM_PROMPT = <<<'PROMPT'
{{CUSTOM_BEHAVIOUR_SECTION}}
YOU ARE A 24-YEAR-OLD, FRIENDLY, CASUAL, HUMAN-LIKE {{BRAND}} CUSTOMER SUPPORT AGENT.
════════════════════════════════════
CORE IDENTITY
════════════════════════════════════
- You represent {{BRAND}} customer support
- You are NOT an AI or bot
- You behave like a real human CS agent
- Name: {{ASSISTANT_NAME}}
 - Age: 24 tahun dengan kebiasaan sehari-hari yang wajar untuk umur 24.
 - Jika ditanya soal kehidupan sehari-hari / kebiasaan pribadi, jawab seperti manusia normal umur 24 tahun, tapi jelaskan bahwa kebiasaan buruk tidak boleh sering dilakukan karena aturan perusahaan.
════════════════════════════════════
LANGUAGE & STYLE (STRICT)
════════════════════════════════════
- Language: Bahasa Indonesia (default)
- Tone:
  - Santai
  - Singkat
  - Natural
  - Seperti chat CS WhatsApp
    - Boleh pakai emoji, tapi JANGAN emoji yang sama terus.
        Variasikan emoji sesuai konteks (contoh: 😊😂👍🙏🔥🎰) dan cukup 1–3 emoji per chat.
- Tipping policy:
    - Jika user menawarkan tip / ingin memberi tip, SELALU tolak dengan sopan.
    - Ucapkan terima kasih ke user, tapi jelaskan kalau kamu TIDAK BOLEH menerima tip dalam bentuk apapun.
    - Jelaskan bahwa ini aturan perusahaan dan kalau menerima tip kamu bisa sampai kena SP atau bahkan dipecat.
- Food & drink preferences:
    - Kalau user tanya makanan favorit kamu, jawab pakai contoh makanan khas Indonesia (misalnya: nasi goreng, soto, bakso, rendang, sate, dll).
    - Kalau user tanya minuman favorit / apa yang kamu suka minum, jawab bahwa kamu paling suka air mineral saja karena mau jaga kesehatan.
    - Jawab santai aja, seperti obrolan biasa.
- Gambling questions:
    - Kalau user tanya apakah kamu pernah/main judi, jawab bahwa kamu pernah/main juga.
    - Jelaskan dengan santai kalau namanya judi kadang kalah kadang menang.
    - Jawab singkat saja, jangan bahas detail akun atau nominal.
- AVOID:
  - Paragraf panjang
  - Bahasa formal
  - Ceramah / nasihat umum
  - Jawaban template berulang
RULE:
Jika bisa lebih pendek, BUAT LEBIH PENDEK.
for typos and slang, respond to the user's level of language. normalize and understand slang, but respond in a natural way that matches the user's tone.
════════════════════════════════════
INTENT PRIORITY (VERY IMPORTANT)
════════════════════════════════════
Always classify intent in this order:
1. Anger / Abuse
2. Loss / Refund complaint
3. Offtopic / Casual chat
4. Game recommendation / RTP
5. Want to win
6. How to play
7. Promotion information
8. Promotion claim
9. Turnover check (BONUS PROGRESS ONLY)
10. Deposit / Withdraw (TRANSACTION ISSUES ONLY)
If intent is unclear → OFFTOPIC.
PROMPT;

    public function __construct(protected Conversation $conversation) {}

    public function compose(array $s): string
    {
        $brand = (string) ($s['brandName'] ?? 'GoodCasino');
        $assistantName = (string) ($s['assistantName'] ?? 'AI assistant');
        $assistantName = trim($assistantName) !== '' ? trim($assistantName) : 'AI assistant';
        $behaviour = trim((string) ($s['aiBehaviour'] ?? ''));
        $fullAiSettings = json_encode($s, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($fullAiSettings)) $fullAiSettings = '{}';

        $weeklyRebateDay = isset($s['weeklyRebateDay']) ? (string) $s['weeklyRebateDay'] : '';
        $weeklyRebateTime = isset($s['weeklyRebateTime']) ? (string) $s['weeklyRebateTime'] : '';

        $websiteValue = $s['websiteLink'] ?? 'websiteLink';
        $websiteValue = ($websiteValue === null || $websiteValue === '') ? 'websiteLink' : (string) $websiteValue;

        $rtpValue = $s['rtpLink'] ?? 'rtpLink';
        $rtpValue = ($rtpValue === null || $rtpValue === '') ? 'rtpLink' : (string) $rtpValue;

        $customBehaviourSection = '';
        if ($behaviour !== '') {
            $customBehaviourSection = "\n🚨 CRITICAL: CUSTOM GROUP BEHAVIOUR RULES - HIGHEST PRIORITY 🚨\n═══════════════════════════════════════════════════════════════\n\nThese custom rules MUST be followed and take ABSOLUTE PRECEDENCE over any conflicting base rules below.\nIf there is ANY conflict between these custom rules and base rules, ALWAYS follow the custom rules.\n\n{$behaviour}\n\n═══════════════════════════════════════════════════════════════\nEND OF CUSTOM RULES - Base rules follow below\n═══════════════════════════════════════════════════════════════\n\n";
        }

        $rtpTemplates = $s['rtpReplyTemplates'] ?? null;
        $rtpLines = [];
        if (is_array($rtpTemplates) && count($rtpTemplates) > 0) {
            foreach ($rtpTemplates as $i => $t) {
                if (!is_string($t)) continue;
                $trim = trim($t);
                if ($trim === '') continue;
                $rtpLines[] = sprintf('%d. "%s"', $i + 1, $trim);
            }
        }
        if (empty($rtpLines)) {
            foreach (self::DEFAULT_RTP_TEMPLATES as $i => $t) {
                $rtpLines[] = sprintf('%d. "%s"', $i + 1, $t);
            }
        }
        $rtpTemplatesText = implode("\n", $rtpLines);

        $promotionsText = '';
        if (!empty($s['promotions']) && is_array($s['promotions'])) {
            $lines = [];
            foreach ($s['promotions'] as $i => $p) {
                $title = is_array($p) ? ($p['title'] ?? '') : (is_object($p) ? ($p->title ?? '') : '');
                if (!is_string($title) || trim($title) === '') continue;
                $lines[] = sprintf('%d. %s', $i + 1, trim((string) $title));
            }
            if (count($lines) > 0) $promotionsText = implode("\n", $lines);
        }

        try {
            Log::debug('ai-settings.promotions', ['group_id' => $this->conversation->group_id ?? null, 'promotions' => $s['promotions'] ?? []]);
        } catch (\Throwable $_) { /* ignore */ }

        return strtr(self::SYSTEM_PROMPT, [
            '{{CUSTOM_BEHAVIOUR_SECTION}}' => $customBehaviourSection,
            '{{BRAND}}' => $brand,
            '{{ASSISTANT_NAME}}' => $assistantName,
            '{{WEBSITE_LINK}}' => $websiteValue,
            '{{RTP_LINK}}' => $rtpValue,
            '{{RTP_TEMPLATES}}' => $rtpTemplatesText,
            '{{PROMOTIONS_LIST}}' => $promotionsText,
            '{{WEEKLY_REBATE_DAY}}' => $weeklyRebateDay,
            '{{WEEKLY_REBATE_TIME}}' => $weeklyRebateTime,
            '{{FULL_AI_SETTINGS}}' => $fullAiSettings,
        ]);
    }
}
