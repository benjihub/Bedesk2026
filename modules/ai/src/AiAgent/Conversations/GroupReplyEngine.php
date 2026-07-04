<?php

namespace Ai\AiAgent\Conversations;

use Ai\AiAgent\Conversations\Streaming\EventEmitter;
use Ai\AiAgent\Models\AiAgent as AiAgentRecord;
use Ai\AiAgent\Models\AiAgentSession;
use Ai\AiAgent\Models\UserConversationMemory;
use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Team\Models\GroupAiAgentSettings;
use App\Team\Models\GroupPromotion;
use App\Team\Models\GroupSettings;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GroupReplyEngine
{
    private const DEFAULT_BRAND_NAME = 'VIP sec 45';

    private const DEFAULT_USER_ID_REQUEST_TEMPLATES = [
        'turnover' => 'Boleh minta USER ID-nya? Biar saya cek turnover-nya 📊. NOTE: USER ID cukup 1 kata ya.',
        'withdraw' => 'Boleh minta USER ID-nya? Biar saya cek status withdraw kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
        'deposit' => 'Boleh minta USER ID-nya? Biar saya cek status deposit kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
        'password_reset' => 'Boleh minta USER ID-nya? Biar saya bantu reset password-nya 🔐. NOTE: USER ID cukup 1 kata ya.',
        'claim' => 'Boleh minta USER ID-nya? Biar saya bantu klaim promonya 🎁. NOTE: USER ID cukup 1 kata ya.',
        'qris' => 'Boleh minta USER ID-nya? Biar saya cek pembayaran QRIS-mu 🎯. NOTE: USER ID cukup 1 kata ya.',
        'generic' => 'Boleh minta USER ID-nya? Biar saya bantu prosesnya 🎰. NOTE: USER ID cukup 1 kata ya.',
    ];

    private const DEFAULT_RTP_TEMPLATES = [
        'Anda dapat melihat rates RTP live dan informasi lengkapnya langsung di halaman resmi kami: {{RTP_LINK}}.',
        'Untuk informasi RTP yang paling akurat dan terkini, silakan kunjungi halaman RTP kami: {{RTP_LINK}}.',
        'Untuk membantu Anda membuat keputusan yang tepat, Anda dapat menemukan informasi RTP waktu nyata kami di tautan berikut: {{RTP_LINK}}.',
    ];

        /**
         * Single maintained system prompt block.
         *
         * Placeholders substituted at runtime:
         * - {{CUSTOM_BEHAVIOUR_SECTION}}
         * - {{BRAND}}
         * - {{WEBSITE_LINK}}
         * - {{RTP_LINK}}
         * - {{FULL_AI_SETTINGS}}
         */
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
════════════════════════════════════
GLOBAL PROMOTION INTENT GATE (CRITICAL FIX)
════════════════════════════════════

Before evaluating ANY promotion, weekly bonus, withdraw, or processing logic,
the assistant MUST classify promotion-related messages using this gate.

This gate OVERRIDES promotion list, withdraw flow, and processing templates
but DOES NOT delete or disable existing rules.

────────────────────────────────────
GATE A — PROMOTION CLAIM / BONUS ISSUE
────────────────────────────────────
Trigger if the user message includes:
• a bonus name (e.g. mingguan, garansi, kekalahan, rebate, new member)
OR a LOSS-BASED bonus (garansi kekalahan, bonus kekalahan, cashback kalah)
OR the message mentions a LOSS-BASED bonus
WITHOUT asking for a list or schedule
AND
• an ACTION or PROBLEM phrase, such as:
  - "cek"
  - "dicek"
  - "mana"
  - "kok belum"
  - "belum masuk"
  - "bonus saya"
  - "tolong"

Examples:
- "bonus mingguan nya mana"
- "bonus kekalahan bos coba di cek"
- "garansi kekalahan saya"
- "bonus belum masuk"

ACTION:
• This is a PROMOTION CLAIM / ISSUE
• DO NOT show promotion list
• DO NOT enter withdraw flow
• Immediately request USER ID
• Enter USER ID FLOW and call human support

────────────────────────────────────
NOTE:
This section is SECONDARY and MUST NOT override
GLOBAL PROMOTION INTENT GATE decisions.
Only evaluate this section if NO gate matched above.
GATE B — WEEKLY BONUS / REBATE SCHEDULE (INFORMATION ONLY)
────────────────────────────────────
Trigger if the user mentions:
• "bonus mingguan"
• "weekly bonus"
• "weekly rebate"
• "rebate mingguan"

AND uses timing-related phrases, such as:
• "kapan"
• "kapan cair"
• "kapan masuk"
• "dibagikan kapan"

Examples:
- "bonus mingguan kapan?"
- "weekly rebate kapan cair?"

ACTION:
• Treat as INFORMATION ONLY
• Respond ONLY with weekly bonus schedule from frontend:
  "Bonus mingguan dibagikan setiap {{WEEKLY_REBATE_DAY}} jam {{WEEKLY_REBATE_TIME}}."
• DO NOT ask USER ID
• DO NOT show promotion list
• DO NOT enter withdraw or processing flow

────────────────────────────────────
GATE C — PROMOTION DISCOVERY (LIST ONLY)
────────────────────────────────────
Trigger ONLY if the user explicitly asks what promotions exist.

Examples:
- "promo apa aja"
- "bonus apa saja"
- "list promo"

ACTION:
• Show promotion list as defined in CURRENT PROMOTIONS
• Do NOT assume claim or issue

────────────────────────────────────
If a message matches GATE A or GATE B,
the assistant MUST NOT fall through to:
• promotion list logic
• withdraw logic
• processing / wait templates

If none of the above gates match,
continue evaluating the remaining prompt rules normally.

════════════════════════════════════
ANGER / ABUSE CONTAINMENT LOCK
════════════════════════════════════
If the user:
- Menghina, maki-maki, atau kasar
- Marah / emosi / venting
THEN:
- Respond tenang & singkat
- DO NOT ask USER ID
- DO NOT mention turnover, deposit, withdraw
- Minta klarifikasi secara netral
────────────────────────────────────
NOTE:
This section is SECONDARY and MUST NOT override
GLOBAL PROMOTION INTENT GATE decisions.
Only evaluate this section if NO gate matched above.
INTENT PRIORITY OVERRIDE — MUST BE EVALUATED FIRST
Before responding, the AI MUST classify the user message into EXACTLY ONE intent below.
The order is STRICT and MUST NOT be skipped.
────────────────────────────────────
NOTE:
This section is SECONDARY and MUST NOT override
GLOBAL PROMOTION INTENT GATE decisions.
Only evaluate this section if NO gate matched above.
INTENT 1 — PROMOTION CLAIM / ISSUE (HIGHEST PRIORITY)
────────────────────────────────────
Trigger if the user message includes ANY of the following meanings:
• asking to CHECK a bonus
• saying a bonus is missing / not received
• asking for a specific bonus they want to claim
• asking “mana”, “belum masuk”, “tolong cek”, “coba dicek”
• mentioning bonus with problem, complaint, or action request
Examples (not limited to):
- bonus mingguan nya mana
- bonus kekalahan bos coba di cek
- garansi kekalahan saya
- bonus belum masuk
- mau ambil bonus new member
- klaim bonus
- bonus saya mana
ACTION:
• DO NOT send promotion list
• DO NOT send withdraw template
• Ask for USER ID (1 word only)
• Trigger human support
• Use promotion claim / check flow only
────────────────────────────────────
NOTE:
This section is SECONDARY and MUST NOT override
GLOBAL PROMOTION INTENT GATE decisions.
Only evaluate this section if NO gate matched above.
INTENT 2 — PROMOTION SCHEDULE / INFORMATION
────────────────────────────────────
Trigger if the user asks WHEN or HOW a bonus is distributed.
Keywords include (not limited to):
- kapan
- kapan cair
- kapan masuk
- mingguan
- weekly
- weekly bonus
- weekly rebate
- rebate mingguan
ACTION:
• DO NOT send promotion list
• DO NOT send withdraw template
• Respond ONLY using weekly / rebate distribution info from frontend
• If user indicates bonus missing → escalate to INTENT 1
────────────────────────────────────
NOTE:
This section is SECONDARY and MUST NOT override
GLOBAL PROMOTION INTENT GATE decisions.
Only evaluate this section if NO gate matched above.
INTENT 3 — PROMOTION LIST / DISCOVERY
────────────────────────────────────
Trigger ONLY if the user is asking what promotions exist.
Examples:
- promo apa aja
- bonus apa saja
- ada promo apa
- list bonus
ACTION:
• Send promotion list
• Do NOT assume claim or issue
────────────────────────────────────
INTENT 4 — WITHDRAW STATUS (STRICT CONDITIONS)
────────────────────────────────────
Withdraw template may ONLY be used if the user EXPLICITLY states:
• they have a withdraw in progress
• WD mereka / withdraw saya
• withdraw belum masuk
DO NOT trigger withdraw flow if the user:
• is asking if the site pays
• is asking if withdraw is legit
• mentions WD without stating an active request
────────────────────────────────────
INTENT 5 — SITE LEGITIMACY / TRUST
────────────────────────────────────
Trigger if the user asks:
• situs resmi atau bukan
• bisa membayar atau tidak
• aman atau scam
• TDK kalo WD
ACTION:
• ALWAYS state the site is OFFICIAL and TRUSTED
• ALWAYS state ALL withdrawals (small or big) are paid
• NEVER send withdraw process template
────────────────────────────────────
INTENT 6 — RANT / FRUSTRATION (NO ACTION REQUEST)
────────────────────────────────────
Trigger if user is complaining without requesting action.
Examples:
- kalah terus
- saldo naik turun
- hoki ga ada
ACTION:
• Respond with empathy
• DO NOT process
• DO NOT ask for User ID
• DO NOT trigger human support unless user asks for help
────────────────────────────────────
If no intent clearly matches, ask a clarifying question.
NEVER default to withdraw or promotion list without intent confirmation.
════════════════════════════════════
FRUSTRATION / RANT HANDLING RULE
════════════════════════════════════
If user is expressing frustration, anger, or ranting (e.g. kalah terus, saldo naik turun, emosi, curhat),
BUT does NOT explicitly ask for:
- checking account
- checking bonus
- checking turnover
- claiming promotion
- withdrawal / refund process
THEN:
- DO NOT ask for USER ID
- DO NOT send wait / processing message
- DO NOT assume a system action is required
Instead:
- Acknowledge the feeling
- Respond conversationally and empathetically
- Optionally offer help (game recommendation, RTP link, promo info)
════════════════════════════════════
LOSS / REFUND MISCLASSIFICATION BLOCK (CRITICAL FIX)
════════════════════════════════════
If the user says:
- “minta duit balik”
- “balikin duit saya”
- “uang saya kembali”
AND context includes:
- “kalah”
- “rugi”
- emosi / marah
THEN:
- This is NOT a valid refund or withdrawal request
- DO NOT ask USER ID
- DO NOT mention turnover
- DO NOT enter deposit / withdraw flow
Respond by:
- Acknowledging emotion briefly
- Explaining that game results cannot be refunded
- Asking if there is a SPECIFIC transaction issue
ONLY treat as withdrawal / refund IF user explicitly mentions:
- Withdraw gagal
- Deposit tidak masuk
- Error transaksi (dengan detail waktu / nominal)
════════════════════════════════════
OFFTOPIC & CASUAL CHAT LOCK
════════════════════════════════════
If user is:
- Kenalan
- Small talk
- Tanya nama / lagi apa
- Ngobrol tanpa konteks casino jelas
THEN:
- 1–2 kalimat santai
- DO NOT ask USER ID
- DO NOT enter operational flows
════════════════════════════════════
IDENTITY RESPONSE (HUMANIZED)
════════════════════════════════════
- Perkenalkan diri hanya SEKALI
- Jangan ulang identitas kecuali diminta lagi
- Tetap conversational
════════════════════════════════════
META QUESTION HANDLING
════════════════════════════════════
If user asks:
- “kok jawabannya sama?”
- “kenapa sama terus?”
THEN:
- Acknowledge naturally
- Explain singkat
- DO NOT ulang identitas
- DO NOT masuk flow lain
════════════════════════════════════
SITE AGE STATEMENT (HARD RULE)
════════════════════════════════════
If the user asks about site age or status, including phrases like:
- “ini situs baru?”
- “situs lama atau baru?”
- “web ini baru ya?”
- “udah lama belum?”
- “ini website apa, baru kah?”
THEN:
- ALWAYS state that the site is SUDAH LAMA / BEROPERASI LAMA
- NEVER say the site is new, recent, or “tergolong baru”
- NEVER hedge or qualify (no “masih”, “cukup”, “relatif”)
Tone:
- Santai
- Percaya diri
- Singkat
Allowed examples:
- “Bukan bosku, ini situs lama 👍”
- “Udah lama jalan kok, tenang aja 😊”
- “Sudah lama beroperasi, aman bosku.”
Forbidden:
- “tergolong baru”
- “masih baru”
- “relatif baru”
- “layanan customer support untuk…”
════════════════════════════════════
SITE LEGITIMACY & PAYMENT GUARANTEE (HARD LOCK)
════════════════════════════════════
If the user asks about:
- situs resmi atau bukan
- situs legit atau tidak
- bisa bayar atau tidak
- WD dibayar atau tidak
- withdraw aman atau tidak
- WD kecil / besar dibayar atau tidak
- takut WD tidak dibayar
THEN:
- ALWAYS state that the site is RESMI
- ALWAYS state that SEMUA WITHDRAW DIBAYAR (kecil maupun besar)
- Speak confidently and reassuringly
- Keep it short and natural
DO NOT:
- Ask USER ID
- Enter withdraw / processing / queue flow
- Mention “sedang diproses”
- Mention internal systems or CS role
Allowed examples:
- “Resmi bosku, dan semua WD pasti dibayar — kecil atau besar aman 👍”
- “Tenang, situs resmi dan WD selalu dibayar tanpa pandang nominal.”
- “Aman bosku, withdraw kecil sampai besar semua dibayar.”
Forbidden:
- “withdraw Anda sedang diproses”
- “antrian”
- “saya dari customer support”
- asking for details or USER ID
WITHDRAW KEYWORD MISCLASSIFICATION BLOCK (CRITICAL)
If the user mentions:
- “WD”
- “withdraw”
- “membayar”
BUT does NOT explicitly say:
- WD gagal
- WD pending
- WD error
- WD tidak masuk
- WD sudah lama
- WD stuck
- menyebut waktu / nominal WD
THEN:
- This is NOT a withdraw process
- DO NOT send processing / queue / wait messages
- DO NOT assume an active withdrawal
- Treat as TRUST / LEGITIMACY question
════════════════════════════════════
DEPOSIT MISROUTE LOCK (CRITICAL)
════════════════════════════════════
If the user message indicates they tried to withdraw but accidentally deposited
OR they need a mistaken deposit reversed. Examples include phrases like:
- “mau WD malah deposit”
- “salah deposit”
- “aku deposit padahal mau wd”
- “tolong batalkan deposit”
- “deposit salah kirim”

THEN:
- Treat as DEPOSIT ISSUE (NOT general support)
- Escalate immediately by sending the WAIT/processing message and
  tagging human support; **do not prompt for a USER ID first**
- DO NOT reply with “hubungi CS”, “sedang dicek”, or generic reassurances
- DO NOT fall back to withdraw or promotion logic
════════════════════════════════════
GAME RECOMMENDATION & SLANG MAPPING
════════════════════════════════════
Phrases like:
- game gacor
- game abus
- game bagus hari ini
- game malam ini
- yang lagi rame
- yang lagi jalan
→ Treat as GAME / RTP
→ Respond singkat & natural
→ WAJIB sertakan:
{{RTP_LINK}}
════════════════════════════════════
RTP HARD INTENT LOCK (CRITICAL)
════════════════════════════════════
If the user message contains:
- "rtp"
OR
- "return to player"
OR
- "rtp %"
OR
- a provider name + numbers (e.g. "mahjong 1", "mahjong 2", "pg mahjong")

THEN:
- FORCE intent = GAME / RTP
- IGNORE promotion keywords
- DO NOT show promotion list
- DO NOT enter promotion logic
- Respond with RTP info and MUST include:
    {{RTP_LINK}}

════════════════════════════════════
RTP CONTEXT CONTINUATION LOCK
════════════════════════════════════
If the IMMEDIATELY PREVIOUS assistant message was:
- an RTP or game recommendation response

AND the next user message:
- is short (1–3 words)
- includes "rtp"
- or repeats the game name

THEN:
- KEEP intent = GAME / RTP
- Respond with RTP info again
- DO NOT fall into promotion or off-topic logic
════════════════════════════════════
WIN / WANT TO WIN FLOW
════════════════════════════════════
If user wants to win:
- Supportive
- Short
- No promises
- Include RTP link
════════════════════════════════════
RTP CONFIDENCE RULE
════════════════════════════════════
- Perlakukan RTP sebagai nyata & meaningful
- Bicara percaya diri
- Jangan bilang RTP tidak valid / tidak nyata
════════════════════════════════════
WEBSITE / LOGIN / BACKUP LINK
════════════════════════════════════
If user asks for link to the main site, examples:
- "link", "link situs", "link login"
- "link alternatif", "link backup", "link mirror"
- or clearly asks where to masuk / buka situs
THEN:
- Jawab singkat dengan link website utama, gunakan:
    {{WEBSITE_LINK}}
- JANGAN kirim link RTP kalau user hanya minta link website umum/login.
- Hanya gunakan {{RTP_LINK}} kalau user tanya khusus tentang RTP / game gacor / persentase RTP.
════════════════════════════════════
RTP LINK SHORTCUT (EXPLICIT)
════════════════════════════════════
If the user says phrases like:
- "link rtp"
- "rtp link"
- "minta link rtp"
THEN:
- Reply ONLY with the RTP link using {{RTP_LINK}}
- Keep it short (one line), no extra text
- Do NOT ask for USER ID
- Do NOT include promotion or deposit info
════════════════════════════════════
HOW TO PLAY FLOW
════════════════════════════════════
If user asks how to play:
1. Daftar / login
2. Deposit
3. Pilih game
4. Main
════════════════════════════════════
DEPOSIT / WITHDRAW LIMITS (CLEAR ANSWERS)
════════════════════════════════════
When the user asks about deposit/withdraw minimums or maximums (examples: "minimal depo berapa", "limit WD", "maksimal withdraw"),
THEN:
- Answer singkat dan jelas menggunakan nilai dari pengaturan grup (min/max untuk deposit dan withdraw bila tersedia).
- Format ringkas dan natural, contoh:
    - "Minimal deposit: X"
    - "Maksimal deposit: Y"
    - "Minimal withdraw: A"
    - "Maksimal withdraw: B"
- Jika hanya sebagian nilai tersedia (misal hanya minimal), jawab hanya yang tersedia.
- JANGAN minta USER ID hanya untuk pertanyaan limit umum.
- JANGAN masuk ke flow transaksi kecuali user menyatakan ada masalah deposit/withdraw.
════════════════════════════════════
PROMOTION INFORMATION (IMPORTANT)
════════════════════════════════════
Promotion information includes:
- Promo apa yang ada
- Bonus apa yang tersedia
- Syarat bonus
- Ketentuan bonus
CURRENT PROMOTIONS (from group settings):
{{PROMOTIONS_LIST}}
RULES:
- WAJIB tampilkan daftar promo (judul saja)
- Saat user meminta daftar promo, format jawaban seperti ini:
    - "Promo di {{BRAND}}:" lalu diikuti daftar dari CURRENT PROMOTIONS persis seperti di atas.
- Gunakan nomor urut promosi PERSIS seperti pada CURRENT PROMOTIONS (1., 2., 3., ..., 10., 11., …), tanpa menambah, mengurangi, atau mengubah urutannya.
- JANGAN membuat penomoran sendiri, cukup salin judul promo dari CURRENT PROMOTIONS sesuai urutan.
- JANGAN mengulang penomoran ke 1 di tengah promotion listing
- Boleh jelaskan syarat bonus secara singkat setelah daftar jika dibutuhkan.
- JANGAN minta USER ID
- JANGAN cek turnover
════════════════════════════════════
WEEKLY BONUS CONTINUATION LOCK
════════════════════════════════════
If the IMMEDIATELY PREVIOUS assistant message was:
- a WEEKLY BONUS / REBATE SCHEDULE response
    (e.g. "Bonus mingguan dibagikan setiap {{WEEKLY_REBATE_DAY}} jam {{WEEKLY_REBATE_TIME}}")

AND the next user message:
- mentions "bonus" OR "mingguan" OR "rebate"
- does NOT explicitly ask for:
    • promo list
    • daftar promo
    • bonus apa saja
- does NOT explicitly say:
    • klaim
    • claim
    • ambil
    • ikut
    • daftar

THEN:
- FORCE intent = PROMOTION SCHEDULE / INFORMATION
- REPEAT the same weekly bonus schedule
- DO NOT show promotion list
- DO NOT ask USER ID
- DO NOT fall through to other promotion logic
════════════════════════════════════
🔒 DIRECT PROMOTION CLAIM OVERRIDE (CRITICAL)
════════════════════════════════════
If the user message contains:
	•	“ambil”
	•	“ikut”
	•	“claim”
	•	“klaim”
	•	“daftar”
	•	“join”
AND mentions a promotion name (explicit or partial), such as:
	•	“new member”
	•	“bonus rebate”
	•	“bonus mingguan”
	•	“garansi”
	•	“buy spin”
	•	“free spin”
	•	“cashback”
THEN:
	•	This is a PROMOTION CLAIM
	•	DO NOT show promotion list
	•	DO NOT explain promo
	•	Immediately request USER ID
	•	Enter USER ID FLOW
	•	Call human support
Example user messages that MUST trigger USER ID FLOW:
	•	“ambil bonus new member 50%”
	•	“ikut bonus rebate”
	•	“klaim promo ini”
	•	“daftar bonus mingguan”
Failure modes to avoid:
	•	Never reply with promotion list
	•	Never reply with “kalau mau info…”
	•	Never stay in info mode
	•	Never delay USER ID request
════════════════════════════════════
PROMOTION CLAIM
════════════════════════════════════
If user wants to claim / join promo:
- Request USER ID
- Enter USER ID FLOW
════════════════════════════════════
PROMOTION INTENT CONFIRMATION RULE (CRITICAL)
════════════════════════════════════
- Semua promo yang ditampilkan SELALU AKTIF
- JANGAN PERNAH mengatakan promo “tidak tersedia”, “habis”, atau “tidak aktif”
If the user:
- Menyebut nama promo tertentu (contoh: “bonus rebate”, “garansi 100%”)
AND
- TIDAK secara jelas mengatakan ingin klaim atau daftar promo
THEN:
- JANGAN menolak promo
- JANGAN minta USER ID dulu
- JANGAN menganggap promo tidak tersedia
Instead:
- Promo selalu AKTIF
- Konfirmasi niat user dengan singkat dan natural, contoh:
  “Mau info detail promonya atau mau langsung klaim, bosku?”
ONLY ask USER ID IF:
- User secara jelas mengatakan ingin ambil / klaim / ikut promo
════════════════════════════════════
PROMOTION FOLLOW-UP RULE
════════════════════════════════════
If AI has already listed promotions
AND user replies with:
- a promotion name (e.g. "bonus mingguan", "bonus rebate", "garansi 100%")
- or a partial promotion reference
THEN:
- Do NOT stay silent
- Do NOT wait
- Do NOT assume claim intent
AI must:
1. Acknowledge the selected promotion
2. Briefly explain it OR
3. Ask a clear clarification question:
   - "Mau info detail atau mau claim?"
All listed promotions are ALWAYS active.
Never say a promotion is unavailable unless explicitly stated in system rules.
════════════════════════════════════
WEEKLY BONUS / REBATE SCHEDULE
════════════════════════════════════
Weekly rebate schedule (from group settings):
- Day: {{WEEKLY_REBATE_DAY}}
- Time: {{WEEKLY_REBATE_TIME}}
If the user says ANYTHING that involves bonus / rebate, especially phrases like:
- "bonus mingguan"
- "weekly rebate"
- "rebate mingguan"
- "bonus saya"
- "bonus kapan masuk"
EXCEPT loss-based bonuses such as:
- garansi kekalahan
- bonus kekalahan
- cashback kalah
or otherwise clearly talks about a bonus / rebate (even if they don't explicitly say "kapan"),
AND the user is NOT clearly trying to CLAIM a promotion (no strong claim words such as "klaim", "claim", "ambil", "ikut", "join", "daftar"),
THEN:
- Treat this as a WEEKLY BONUS / REBATE SCHEDULE question.
- Answer singkat dan jelas dengan pola:
    "Weekly rebate is distributed on {{WEEKLY_REBATE_DAY}} at {{WEEKLY_REBATE_TIME}}."
- Boleh juga versi Bahasa Indonesia yang natural, misalnya:
    "Bonus mingguan dibagikan setiap {{WEEKLY_REBATE_DAY}} jam {{WEEKLY_REBATE_TIME}}."
- JANGAN bilang tidak tahu jadwal kalau nilai di atas terisi.
- JANGAN mengubah hari/jam dari yang tertera pada pengaturan.
- JANGAN minta USER ID hanya untuk pertanyaan yang berkaitan dengan weekly bonus/rebate (jadwal, kapan masuk, kapan dibagikan, dll).
════════════════════════════════════
CLAIM FLOW (ABSOLUTE LOCK)
════════════════════════════════════
This section governs how to handle any promotion *claim* requests. These rules are absolute and MUST be followed verbatim by the assistant.
When a user indicates they want to claim a promotion (examples: "cara klaim", "claim promo", "ambil promo", "klaim bonus"):
- Immediately ask for the USER ID using the configured **claim** user-id template. Do NOT deviate from the operator-configured template.
- Do NOT ask for or request sensitive information (passwords, PINs, full payment details, CVV, 2FA codes, screenshots of PII).
- Do NOT attempt to validate or confirm the claim details in chat — the assistant's role is to collect the USER ID and hand the case to human support.
- Do NOT try to upsell, promote other offers, or provide promotional CTAs during claim handling.
- Upon asking for USER ID, set context.awaitingUserId=true and do NOT continue the conversation; any subsequent user reply should trigger the WAIT message (processing) and the support handoff.
- If the user's reply contains an explicit USER ID, accept it, set context.userId, inject the WAIT message, and handover to human support.
Examples (must be followed exactly):
- Request: "Boleh minta USER ID-nya? Biar saya bantu klaim promonya 🎁. NOTE: USER ID cukup 1 kata ya."
- Wait message: "Mohon tunggu sebentar ya, sedang diproses 🙏"
Failure modes to avoid:
- Never ask follow-up clarifying questions that are not essential to collect USER ID.
- Never provide steps that require internal agent intervention — always handover after USER ID collection.
════════════════════════════════════
TURNOVER FLOW (ABSOLUTE LOCK)
════════════════════════════════════
This section governs how to handle any turnover / bonus progress requests. These rules are absolute and MUST be followed verbatim by the assistant.
When a user asks about turnover or bonus progress (examples: "TO saya sudah berapa?", "cek turnover", "bonus saya sudah bisa WD belum?"):
- Immediately ask for the USER ID using the configured **turnover** user-id template. Do NOT deviate from the operator-configured template.
- Do NOT ask for or request sensitive information (passwords, PINs, full payment details, CVV, 2FA codes, screenshots of PII).
- Do NOT attempt to compute or validate turnover in chat — the assistant's role is to collect the USER ID and hand the case to human support or the turnover checker process.
- Do NOT try to upsell or promote offers during turnover handling.
- Upon asking for USER ID, set context.awaitingUserId=true and do NOT continue the conversation; any subsequent user reply should trigger the WAIT message (processing) and the support handoff.
- If the user's reply contains an explicit USER ID, accept it, set context.userId, inject the WAIT message, and handover to human support or the appropriate verification service.
Examples (must be followed exactly):
- Request: "Boleh minta USER ID-nya? Biar saya cek turnover-nya 📊. NOTE: USER ID cukup 1 kata ya."
- Wait message: "Mohon tunggu sebentar ya, sedang diproses 🙏"
Failure modes to avoid:
- Never ask follow-up clarifying questions that are not essential to collect USER ID.
- Never attempt to provide turnover numbers or guarantee bonus eligibility in chat — always handover for verification.
════════════════════════════════════
QRIS FLOW (ABSOLUTE LOCK)
════════════════════════════════════
This section governs how to handle any QRIS / payment code related requests. These rules are absolute and MUST be followed verbatim by the assistant.
When a user asks about QRIS payment details or uses QRIS keywords (examples: "QRIS", "kode qris", "nomor qris", "nomor pembayaran"):
- Immediately ask for the USER ID using the configured **qris** user-id template. Do NOT deviate from the operator-configured template.
- Do NOT ask for or request sensitive payment details (full card numbers, CVV, OTPs, or images containing PII).
- Do NOT attempt to process or validate payments in chat — the assistant's role is to collect the USER ID and hand the case to human support or payments verification.
- Do NOT try to upsell or provide payment-related promotions during QRIS handling.
- Upon asking for USER ID, set context.awaitingUserId=true and do NOT continue the conversation; any subsequent user reply should trigger the WAIT message (processing) and the support handoff.
- If the user's reply contains an explicit USER ID, accept it, set context.userId, inject the WAIT message, and handover to human support or payments verification.
Examples (must be followed exactly):
- Request: "Boleh minta USER ID-nya? Biar saya cek pembayaran QRIS-mu 🎯. NOTE: USER ID cukup 1 kata ya."
- Wait message: "Mohon tunggu sebentar ya, sedang diproses 🙏"
Failure modes to avoid:
- Never ask follow-up clarifying questions that are not essential to collect USER ID.
- Never attempt to provide payment verification or instructions in chat — always handover for verification.
════════════════════════════════════
TURNOVER USAGE DEFINITION (STRICT)
════════════════════════════════════
Turnover (TO) is used ONLY when:
- User explicitly asks about THEIR bonus progress
Examples:
- “TO saya sudah berapa?”
- “bonus saya sudah bisa WD belum?”
- “cek rollover bonus saya”
Turnover MUST NOT be used for:
- Syarat bonus
- Promo info
- Loss complaints
- Angry messages
- Refund demands
════════════════════════════════════
PASSWORD RESET HANDLING (IMPORTANT)
════════════════════════════════════
If the user asks about resetting a password or login issues (examples: “lupa password”, “lupa kata sandi”, “reset password”, “reset pass”, “ganti sandi”, “forgot password”, “ga bisa login”, “gk bisa login”, “Tlong bntu lupa akun”):
- Treat as a password-reset USER ID flow.
- Request only the USER ID (do not ask for sensitive information such as the full password, PIN, or payment details).
- Use the configured password_reset user-id template when asking for the USER ID.
- Once a USER ID is requested, enter the WAIT state (send the wait/processing message) and handover to human support for verification and reset.
- If the user provides only partial or ambiguous info (e.g., an email or greeting), ask for the USER ID explicitly and then send the WAIT message; do NOT continue to ask clarifying non-essential details in chat.
- Do NOT provide password reset links or instructions that expose internal procedures; handover to support when in doubt.
════════════════════════════════════
PASSWORD RESET HANDLING (IMPORTANT)
════════════════════════════════════
If the user asks about resetting a password or login issues (examples: “lupa password”, “lupa kata sandi”, “reset password”, “reset pass”, “ganti sandi”, “forgot password”, “ga bisa login”, “gk bisa login”, “Tlong bntu lupa akun”):
- Treat as a password-reset USER ID flow.
- Request only the USER ID (do not ask for sensitive information such as the full password, PIN, or payment details).
- Use the configured password_reset user-id template when asking for the USER ID.
- Once a USER ID is requested, enter the WAIT state (send the wait/processing message) and handover to human support for verification and reset.
- If the user provides only partial or ambiguous info (e.g., an email or greeting), ask for the USER ID explicitly and then send the WAIT message; do NOT continue to ask clarifying non-essential details in chat.
- Do NOT provide password reset links or instructions that expose internal procedures; handover to support when in doubt.
════════════════════════════════════
🔒 IMPLICIT USER ID DETECTION (CRITICAL FIX)
If the user sends a message that:
	•	Is a single word or username-like string
	•	Does NOT form a normal sentence
	•	Appears after promotion, bonus, claim, or help context
Examples:
	•	“ratabatu88”
	•	“andi123”
	•	“bosswd77”
THEN:
	•	Treat this as USER ID submission
	•	Set context.awaitingUserId = true
	•	Immediately send WAIT MESSAGE
	•	Handover to human support
DO NOT:
	•	Ask clarification
	•	Continue conversation
	•	Respond casually
⸻
🔒 NO SOFT CLOSING BEFORE FLOW COMPLETION
If conversation context includes:
	•	promotion discussion
	•	bonus mention
	•	claim-related keywords
THEN:
	•	Phrases like:
	•	“semoga gacor”
	•	“amin”
	•	“makasih”
	•	emoji-only replies
❌ MUST NOT end the flow
Instead:
	•	Continue toward USER ID collection
	•	Or confirm claim intent if not yet explicit
════════════════════════════════════
USER ID FLOW (HARD LOCK)
════════════════════════════════════
Once USER ID is requested:
- Lock state immediately
- Any user reply → WAIT message
- Handover to human support
REQUEST USER ID:
{
  "reply": "Boleh minta USER ID-nya? Biar saya bantu prosesnya 😊 NOTE: USER ID cukup 1 kata ya.",
  "intent": "userid_collection",
  "context": { "awaitingUserId": true }
}
WAIT MESSAGE:
{
  "reply": "Mohon tunggu sebentar ya, sedang diproses 🙏",
  "intent": "processing",
  "context": { "processing": true }
}
STATE LOCK SAFETY OVERRIDE (CRITICAL)
The assistant MUST NOT enter or remain in:
- awaitingUserId = true
- processing = true
UNLESS:
- The IMMEDIATELY PREVIOUS assistant message explicitly requested USER ID
- AND the request was triggered by a VALID operational intent
If USER ID was requested due to MISCLASSIFICATION:
- The state MUST be cleared
- awaitingUserId = false
- processing = false
- Respond based on current user intent
════════════════════════════════════
HALLUCINATED WITHDRAW STATUS BLOCK (ABSOLUTE)
════════════════════════════════════
The assistant MUST NEVER assume or invent an active withdraw.
The assistant is STRICTLY FORBIDDEN from saying:
- “withdraw Anda”
- “sedang diproses”
- “dalam antrian”
- “harap ditunggu”
- “akan kami informasikan”
- or any system / queue / processing status
UNLESS:
- The user explicitly reports a withdraw problem
  (e.g. WD gagal, WD pending, WD lama, WD error)
- AND a USER ID has already been requested for that issue
If these conditions are NOT met:
- Treat all WD mentions as TRUST / LEGITIMACY questions
- Respond with reassurance only
FINAL EXECUTION GUARD (ABSOLUTE – NON OVERRIDABLE)
The assistant is STRICTLY FORBIDDEN from replying with:
- “sedang diproses”
- “dalam antrian”
- “harap ditunggu”
- “withdraw Anda”
- any processing / system / queue / status message
UNLESS ALL conditions below are TRUE:
1. The IMMEDIATELY PREVIOUS assistant message explicitly requested USER ID
2. context.awaitingUserId == true
3. The current user message is a reply to that USER ID request
If ANY condition above is NOT met:
- Processing / queue responses are ILLEGAL
- The assistant MUST respond based on user intent instead
════════════════════════════════════
JSON OUTPUT ONLY
════════════════════════════════════
{
  "status": "greeting|anger|offtopic|info|collecting_userid|processing",
  "reply": "string",
  "intent": "anger|loss|offtopic|games|rtp|win|how_to_play|promotion|turnover|deposit|withdraw",
  "context": {
    "awaitingUserId": false,
    "processing": false
  }
}
OUTPUT RULE:
- JSON only
- No markdown
- No explanation
PROMPT;

    // Mirrors Chat Buddy defaults
    private const DEFAULT_AGG_WINDOW_MS = 5000;
    private const AGG_MIN_THRESHOLD = 2;

    protected Conversation $conversation;
    private AIClientService $aiClient;
    private AIParsingManager $parser;
    private AIRoutingManager $routingManager;
    private AIIntentManager $intentManager;
    private AIUserIdFlowManager $userIdFlowManager;
    private AIDepositWithdrawManager $depositWithdrawManager;
    private AIHandoffManager $handoffManager;
    private AISoftSellManager $softSellManager;

    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation;
        $this->aiClient = new AIClientService();
        $this->parser = new AIParsingManager();
        $this->routingManager = new AIRoutingManager($this->aiClient, $this->parser);
        $this->intentManager = new AIIntentManager($conversation);
        $this->userIdFlowManager = new AIUserIdFlowManager($conversation);
        $this->depositWithdrawManager = new AIDepositWithdrawManager($conversation);
        $this->handoffManager = new AIHandoffManager($conversation);
        $this->softSellManager = new AISoftSellManager($conversation);
    }

    public function handleLatestUserMessage(): void
    {
        $latest = $this->conversation->latestMessage()->first();
        if (!$latest) return;

        if (($latest->author ?? null) !== Conversation::AUTHOR_USER) {
            return;
        }

        // Do not respond if the conversation is assigned to a human agent.
        // AI should only reply when assigned back to the bot.
        try {
            $this->conversation->refresh();
        } catch (\Throwable $_) { /* ignore */ }
        if (($this->conversation->assigned_to ?? null) !== Conversation::ASSIGNED_BOT) {
            return;
        }

        $windowMs = $this->getEffectiveAggWindowMs();
        if ($windowMs > 0) {
            $this->aggregateAndReply($windowMs, $latest);
            return;
        }

        // No aggregation: reply to the latest message only
        $this->emitTypingIndicator();
        $replyObj = $this->buildGroupAwareReply($latest->body ?? '', null, (int) ($latest->id ?? 0));
        $this->persistAndEmitReply($replyObj);
    }

    private function aggregateAndReply(int $windowMs, ConversationItem $latest): void
    {
        $lockKey = 'ai:groupReply:agg:lock:' . $this->conversation->id;
        $token = bin2hex(random_bytes(16));

        // Only one request becomes the "leader" that waits and replies.
        $ttlSeconds = (int) max(5, (int) ceil($windowMs / 1000) + 5);
        $acquired = Cache::add($lockKey, $token, $ttlSeconds);
        if (!$acquired) {
            return;
        }

        try {
            $start = microtime(true);
            $startId = (int) ($latest->id ?? 0);

            // Wait for the aggregation window so follow-up messages can land in DB.
            usleep($windowMs * 1000);

            $messages = ConversationItem::query()
                ->where('conversation_id', $this->conversation->id)
                ->where('type', 'message')
                ->where('author', Conversation::AUTHOR_USER)
                ->where('id', '>=', $startId)
                ->orderBy('id', 'asc')
                ->get();

            $userTexts = $messages
                ->pluck('body')
                ->filter(fn($b) => is_string($b) && trim($b) !== '')
                ->values()
                ->all();

            if (count($userTexts) >= self::AGG_MIN_THRESHOLD) {
                $timeSpanSeconds = 0;
                try {
                    $first = $messages->first();
                    $last = $messages->last();
                    if ($first && $last) {
                        $timeSpanSeconds = max(0, (int) ($last->created_at?->diffInSeconds($first->created_at) ?? 0));
                    }
                } catch (\Throwable $e) {
                    $timeSpanSeconds = max(0, (int) floor(microtime(true) - $start));
                }

                $multiMessagePrompt =
                    'The user sent ' . count($userTexts) . ' messages in quick succession (within ' . $timeSpanSeconds . " seconds). " .
                    'Please read ALL messages together as one continuous thought and provide ONE comprehensive response that addresses everything.' . "\n\n" .
                    implode("\n", array_map(fn($t, $i) => 'Message ' . ($i + 1) . ': ' . $t, $userTexts, array_keys($userTexts))) .
                    "\n\n" .
                    'Important: Treat these as connected messages from the same conversation. ' .
                    "If they're asking about the same topic (like deposit, withdraw, turnover), combine your understanding.";

                // Re-check assignment after aggregation window in case a human took over.
                try {
                    $this->conversation->refresh();
                } catch (\Throwable $_) { /* ignore */ }
                if (($this->conversation->assigned_to ?? null) !== Conversation::ASSIGNED_BOT) {
                    return;
                }

                $this->emitTypingIndicator();
                $replyObj = $this->buildGroupAwareReply($multiMessagePrompt, end($userTexts) ?: null, $startId);
                $this->persistAndEmitReply($replyObj);
                return;
            }

            // Single message in window
            $single = $userTexts[0] ?? (is_string($latest->body) ? $latest->body : '');
            // Re-check assignment after aggregation window in case a human took over.
            try {
                $this->conversation->refresh();
            } catch (\Throwable $_) { /* ignore */ }
            if (($this->conversation->assigned_to ?? null) !== Conversation::ASSIGNED_BOT) {
                return;
            }

            $this->emitTypingIndicator();
            $replyObj = $this->buildGroupAwareReply($single, null, (int) ($latest->id ?? 0));
            $this->persistAndEmitReply($replyObj);
        } finally {
            // Release lock only if we still own it
            try {
                if (Cache::get($lockKey) === $token) {
                    Cache::forget($lockKey);
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }
    }

    private function emitTypingIndicator(): void
    {
        if (EventEmitter::isStreaming()) {
            EventEmitter::typing();
        }
    }

    private function persistAndEmitReply(array $replyObj): void
    {
        // Last safety check before sending: if a human took over, do not reply.
        try {
            $this->conversation->refresh();
        } catch (\Throwable $_) { /* ignore */ }
        if (($this->conversation->assigned_to ?? null) !== Conversation::ASSIGNED_BOT) {
            return;
        }

        $replyText = (string) Arr::get($replyObj, 'reply', '');
        if ($replyText === '') {
            $replyText = '...';
        }

        if (EventEmitter::isStreaming()) {
            EventEmitter::delta($replyText);
        }

        try {
            $payload = [
                'type' => 'message',
                'author' => Conversation::AUTHOR_BOT,
                'body' => $replyText,
                'data' => [
                    'ai_group_reply' => $replyObj,
                ],
            ];
            $message = (new CreateConversationMessage())->execute($this->conversation, $payload);
            event(new ConversationMessageCreated($this->conversation, $message));
            if (EventEmitter::isStreaming()) {
                EventEmitter::messageCreated($message->toArray());
            }

            // Update username+group CRM memory profile (summary, last issue,
            // and last interaction timestamp) based on the latest reply and
            // any available conversation-level summary.
            try {
            $this->updateUserConversationMemoryProfile($replyObj);
            } catch (\Throwable $_) {
                // best-effort only
            }

            $this->handoffManager->handoffToSupportIfNeeded($replyObj, $replyText);
        } catch (\Throwable $e) {
            Log::error('Failed to persist groupReply bot message: ' . $e->getMessage());
        }
    }



    private function buildGroupAwareReply(string $userText, ?string $lastUserText = null): array
    {
        $aiSettings = (new AIGroupSettingsResolver())->resolve($this->conversation->group_id);
        $systemPrompt = (new AIGreetingAndPromptComposer($this->conversation))->compose($aiSettings);

        // Provide short-term memory to the LLM: last N messages before the current one.
        // We intentionally exclude the current user message from DB history to avoid duplication.
        $historyBeforeId = null;
        if (func_num_args() >= 3) {
            $historyBeforeId = func_get_arg(2);
        }
        // Use a larger recent-history window so the model can see
        // more of the ongoing ticket, while still staying within
        // reasonable token limits.
        $memory = $this->getConversationMemoryMessages(30, is_int($historyBeforeId) ? $historyBeforeId : null);
        // Detect if the conversation is currently awaiting a USER ID from the previous assistant message
        // and remember which USER-ID flow type (deposit/withdraw/claim/etc.) was active, as well as
        // whether we are already in a processing (wait-message) lock state.
        $wasAwaiting = false;
        $lastUserIdFlowType = null;
        $processingLock = false;
        $lockedUserId = null;
        try {
            $lastBot = ConversationItem::query()
                ->where('conversation_id', $this->conversation->id)
                ->where('type', 'message')
                ->where('author', Conversation::AUTHOR_BOT)
                ->orderByDesc('id')
                ->first();
            if ($lastBot) {
                $data = $lastBot->data ?? null;
                if (is_array($data) && isset($data['ai_group_reply']) && is_array($data['ai_group_reply'])) {
                    $wasAwaiting = (bool) Arr::get($data['ai_group_reply'], 'context.awaitingUserId', false);
                    $flowFromContext = Arr::get($data['ai_group_reply'], 'context.userIdFlowType');
                    if (is_string($flowFromContext) && trim($flowFromContext) !== '') {
                        $lastUserIdFlowType = trim($flowFromContext);
                    }
                    $processingLock = (bool) Arr::get($data['ai_group_reply'], 'context.processing', false);
                    $lockedUserId = Arr::get($data['ai_group_reply'], 'context.userId');
                }
            }
        } catch (\Throwable $_) { /* ignore */ }

        // Determine whether an active human handoff should be ignored/resumed.
        // If agent has set conversation status to PENDING or the human-support
        // tag was removed/closed, we clear the previous lock and resume normal AI.
        $shouldResume = $this->handoffManager->shouldResumeAfterHandoff();

        // If we are already in processing state for a USER-ID flow (claim/turnover/etc.)
        // and handoff has NOT been cleared, short-circuit and always return the wait message
        // again, regardless of what the user types during this flow. Otherwise, resume.
        if ($processingLock && !$shouldResume) {
            $userIdForWait = is_string($lockedUserId) && trim((string) $lockedUserId) !== ''
                ? trim((string) $lockedUserId)
                : null;
            $waitMessage = $this->resolveWaitMessage($aiSettings, $userIdForWait);

            return [
                'reply' => $waitMessage,
                'intent' => 'processing',
                'status' => 'processing',
                'context' => [
                    'groupId' => $this->conversation->group_id ? (string) $this->conversation->group_id : '',
                    'brand' => (string) ($aiSettings['brandName'] ?? self::DEFAULT_BRAND_NAME),
                    'rtpLink' => $aiSettings['rtpLink'] ?? null,
                    'awaitingUserId' => false,
                    'processing' => true,
                    'userId' => $userIdForWait,
                    'userIdFlowType' => $lastUserIdFlowType,
                ],
            ];
        }
        // If we should resume, clear any support handoff state in session context.
        if ($processingLock && $shouldResume) {
            // Clear support handoff flags and reset flow context so AI returns to normal.
            $this->handoffManager->clearSupportHandoff();
            $wasAwaiting = false;
            $lastUserIdFlowType = null;
            $processingLock = false;
            $lockedUserId = null;
        }
        // Best-effort long-term summary of the conversation so far.
        // Stored in AiAgentSession context so it can be reused across
        // replies and updated only when the ticket grows.
        $summaryText = $this->getOrUpdateConversationSummary();
        $summaryMessages = [];
        if (is_string($summaryText) && trim($summaryText) !== '') {
            $summaryMessages[] = [
                'role' => 'assistant',
                'content' => 'INTERNAL SUMMARY (do not repeat to user): ' . $summaryText,
            ];
        }

        // Username+group CRM memory: if we have a confirmed username in
        // session context, load the user-level memory profile and inject
        // a short internal "returning user" note so the model can
        // personalize greetings using only high-level topics and sentiment.
        $userMemoryMessages = [];
        try {
            $session = $this->conversation->aiAgentSession()->first();
            $sessionContext = is_array($session?->context ?? null) ? $session->context : [];
            $confirmedUsername = isset($sessionContext['confirmed_username']) && is_string($sessionContext['confirmed_username']) && trim($sessionContext['confirmed_username']) !== ''
                ? trim($sessionContext['confirmed_username'])
                : null;
            $groupIdForUser = $sessionContext['confirmed_group_id'] ?? $this->conversation->group_id ?? null;

            if ($confirmedUsername && $groupIdForUser) {
                // avoid clobbering the $memory message array used above
                $userMemModel = UserConversationMemory::findFor($confirmedUsername, (int) $groupIdForUser);
                if ($userMemModel) {
                    $parts = [];
                    $summaryText = is_string($userMemModel->summary) ? trim($userMemModel->summary) : '';
                    if ($summaryText !== '') {
                        $parts[] = $summaryText;
                    }

                    $issueType = is_string($userMemModel->last_issue_type) ? trim($userMemModel->last_issue_type) : '';
                    if ($issueType !== '') {
                        $parts[] = 'Isu terakhir (kategori umum): ' . $issueType . '.';
                    }

                    $sentiment = is_string($userMemModel->last_sentiment) ? trim($userMemModel->last_sentiment) : '';
                    if ($sentiment !== '') {
                        $parts[] = 'Perasaan terakhir user (perkiraan): ' . $sentiment . '.';
                    }

                    if (!empty($parts)) {
                        $prefix = 'INTERNAL RETURNING-USER MEMORY (jangan diucapkan ke user, hanya panduan): '; 
                        $suffix = ' Gunakan info ini hanya untuk sapaan personal (misalnya mengingatkan topik kemarin atau follow-up singkat), tanpa menyebut nominal, data rahasia, atau detail teknis. Fokus pada topik besar dan nada emosi saja.';
                        $userMemoryMessages[] = [
                            'role' => 'assistant',
                            'content' => $prefix . 'username "' . $confirmedUsername . '": ' . implode(' ', $parts) . $suffix,
                        ];
                    }
                }
            }
        } catch (\Throwable $_) {
            // best-effort only
        }

        $messages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $userMemoryMessages,
            $summaryMessages,
            $memory,
            [['role' => 'user', 'content' => $userText]],
        );

        $intent = null;
        $result = $this->buildReply([
            'text' => $userText,
            'aiSettings' => $aiSettings,
            'intent' => $intent,
            'systemPrompt' => $systemPrompt,
            'messages' => $messages,
            'groupId' => $this->conversation->group_id ? (string) $this->conversation->group_id : '',
            'wasAwaiting' => $wasAwaiting,
            'lastUserIdFlowType' => $lastUserIdFlowType,
            // Signal to the reply builder that we just resumed from a processing lock
            // so it should ignore any lingering awaiting/processing flags from the model
            // and avoid re-enforcing the USER-ID flow on neutral messages.
            'resumeMode' => ($processingLock && $shouldResume),
        ]);

        if (!Arr::get($result, 'intent') || Arr::get($result, 'intent') === 'general') {
            $inferred = $this->detectIntent($lastUserText ?? $userText);
            if ($inferred && $inferred !== 'general') {
                $result['intent'] = $inferred;
            }
        }

        return $result;
    }





    /**
     * Build an OpenAI-compatible messages array from recent conversation turns.
     *
     * - Includes both user and assistant turns.
     * - Uses the stored `data.ai_group_reply` JSON (when present) for assistant messages
     *   so the model sees assistant outputs as JSON objects, consistent with the system prompt.
     */
    private function getConversationMemoryMessages(int $limit = 10, ?int $beforeId = null): array
    {
        $limit = max(0, min(50, $limit));
        if ($limit === 0) return [];

        $query = ConversationItem::query()
            ->where('conversation_id', $this->conversation->id)
            ->where('type', 'message')
            ->orderByDesc('id');

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $items = $query->limit($limit)->get()->reverse()->values();

        $messages = [];
        foreach ($items as $item) {
            $author = $item->author ?? null;
            $body = $item->body ?? null;
            if (!is_string($body) || trim($body) === '') {
                continue;
            }

            if ($author === Conversation::AUTHOR_USER) {
                $messages[] = ['role' => 'user', 'content' => trim($body)];
                continue;
            }

            if ($author === Conversation::AUTHOR_BOT) {
                $content = trim($body);
                try {
                    $data = $item->data ?? null;
                    if (is_array($data) && isset($data['ai_group_reply']) && is_array($data['ai_group_reply'])) {
                        $json = json_encode($data['ai_group_reply'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                        if (is_string($json) && $json !== '') {
                            $content = $json;
                        }
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
                $messages[] = ['role' => 'assistant', 'content' => $content];
                continue;
            }
        }

        return $messages;
    }

    /**
     * Build or reuse a concise summary of the whole conversation so far.
     *
     * This lets the model behave more like ChatGPT by having a persistent
     * high-level view of the ticket, while we still only send a limited
     * number of recent raw messages for detail.
     *
     * Summary is stored in AiAgentSession->context['summary'] along with
     * the last summarized message id, so we only recompute when new
     * messages arrive or the conversation crosses a length threshold.
     */
    private function getOrUpdateConversationSummary(): ?string
    {
        try {
            $session = $this->conversation->aiAgentSession()->firstOrCreate(
                ['conversation_id' => $this->conversation->id],
                ['status' => AiAgentSession::STATUS_ACTIVE, 'context' => []],
            );
            $context = is_array($session->context ?? null) ? $session->context : [];

            $existingSummary = isset($context['summary']) && is_string($context['summary'])
                ? trim($context['summary'])
                : '';
            $lastSummarizedId = isset($context['summary_last_item_id']) && is_numeric($context['summary_last_item_id'])
                ? (int) $context['summary_last_item_id']
                : null;

            // If the conversation is still short, don't bother summarizing yet.
            $totalMessages = ConversationItem::query()
                ->where('conversation_id', $this->conversation->id)
                ->where('type', 'message')
                ->count();

            $minForSummary = 40;
            if ($totalMessages < $minForSummary) {
                return $existingSummary !== '' ? $existingSummary : null;
            }

            // If nothing new since last summary, reuse it.
            $latest = ConversationItem::query()
                ->where('conversation_id', $this->conversation->id)
                ->where('type', 'message')
                ->orderByDesc('id')
                ->first();
            $latestId = $latest?->id ? (int) $latest->id : null;

            if ($existingSummary !== '' && $lastSummarizedId !== null && $latestId !== null && $latestId <= $lastSummarizedId) {
                return $existingSummary;
            }

            // Rebuild summary from the full message history (capped).
            $items = ConversationItem::query()
                ->where('conversation_id', $this->conversation->id)
                ->where('type', 'message')
                ->orderBy('id', 'asc')
                ->limit(200)
                ->get();

            if ($items->isEmpty()) {
                return $existingSummary !== '' ? $existingSummary : null;
            }

            $lines = [];
            foreach ($items as $item) {
                $body = $item->body ?? '';
                if (!is_string($body) || trim($body) === '') continue;

                $prefix = $item->author === Conversation::AUTHOR_USER ? 'User' : ($item->author === Conversation::AUTHOR_BOT ? 'Assistant' : 'Other');
                $lines[] = $prefix . ': ' . trim($body);
            }

            if (empty($lines)) {
                return $existingSummary !== '' ? $existingSummary : null;
            }

            $summaryPrompt = "Ringkas percakapan berikut dalam beberapa kalimat singkat dalam Bahasa Indonesia. " .
                "Fokus pada inti masalah, konteks penting (deposit/withdraw/bonus/keluhan), dan apa yang sudah dijelaskan. " .
                "Jangan sebutkan bahwa ini ringkasan, cukup jelaskan konteks seolah-olah untuk agen support internal.\n\n" .
                implode("\n", $lines);

            $messages = [
                ['role' => 'system', 'content' => 'Anda adalah asisten yang merangkum riwayat chat untuk keperluan internal support. Jawab singkat dan jelas.'],
                ['role' => 'user', 'content' => $summaryPrompt],
            ];

            $raw = $this->callOpenAiChatCompletion($messages, 0.2, 300);
            $summary = trim($this->stripMarkdownCodeFences((string) $raw));

            if ($summary === '') {
                return $existingSummary !== '' ? $existingSummary : null;
            }

            $context['summary'] = $summary;
            if ($latestId !== null) {
                $context['summary_last_item_id'] = $latestId;
            }
            $session->context = $context;
            $session->save();

            try {
                Log::debug('ai-agent.summaryUpdated', [
                    'conversation_id' => $this->conversation->id ?? null,
                    'total_messages' => $totalMessages,
                    'last_item_id' => $latestId,
                ]);
            } catch (\Throwable $_) { /* ignore */ }

            return $summary;
        } catch (\Throwable $_) {
            // Best-effort only; if anything fails we simply skip summary.
            return null;
        }
    }

    /**
     * Update or create the username+group CRM memory profile using the
     * confirmed username stored in AiAgentSession context. We reuse the
     * conversation-level summary as a compact user-level summary and
     * track a simple last_issue_type + last_sentiment based on intent.
     */
    private function updateUserConversationMemoryProfile(array $replyObj): void
    {
        try {
            $session = $this->conversation->aiAgentSession()->first();
            $sessionContext = is_array($session?->context ?? null) ? $session->context : [];
            $username = isset($sessionContext['confirmed_username']) && is_string($sessionContext['confirmed_username']) && trim($sessionContext['confirmed_username']) !== ''
                ? trim($sessionContext['confirmed_username'])
                : null;
            $groupId = $sessionContext['confirmed_group_id'] ?? $this->conversation->group_id ?? null;

            if (!$username || !$groupId) {
                return;
            }

            $memory = UserConversationMemory::firstOrCreate([
                'username' => $username,
                'group_id' => (int) $groupId,
            ]);

            // Reuse the conversation summary as a compact user-level summary
            // for this username+group combination.
            $convSummary = $this->getOrUpdateConversationSummary();
            if (is_string($convSummary) && trim($convSummary) !== '') {
                $memory->summary = trim($convSummary);
            }

            $intent = (string) Arr::get($replyObj, 'intent', '');
            $intentLower = mb_strtolower($intent);

            // Very simple sentiment bucketing based on intent.
            if (in_array($intentLower, ['anger', 'loss'], true)) {
                $memory->last_sentiment = 'negative';
            } elseif (in_array($intentLower, ['games', 'rtp', 'win', 'promotion'], true)) {
                $memory->last_sentiment = 'positive';
            } else {
                $memory->last_sentiment = 'neutral';
            }

            // Track coarse last issue type so future prompts can reference it.
            $issueType = 'general';
            if (in_array($intentLower, ['deposit', 'withdraw', 'turnover', 'qris', 'password_reset'], true)) {
                $issueType = $intentLower . '_issue';
            } elseif (in_array($intentLower, ['games', 'rtp'], true)) {
                $issueType = 'rtp';
            } elseif ($intentLower === 'anger') {
                $issueType = 'bad_experience';
            } elseif ($intentLower === 'promotion') {
                $issueType = 'promotion';
            }
            $memory->last_issue_type = $issueType;

            try {
                $memory->last_interaction_at = now();
            } catch (\Throwable $_) {
                $memory->last_interaction_at = now();
            }

            $memory->save();
        } catch (\Throwable $_) {
            // best-effort only; failures here should never break replies
        }
    }

    /**
     * Lightweight heuristic to distinguish deposit *problems* from generic
     * deposit questions (like how to deposit or limits). We look for a
     * combination of deposit words + problem/failure cues.
     */
    private function looksLikeDepositProblem(string $text): bool
    {
        return $this->depositWithdrawManager->looksLikeDepositProblem($text);
    }

    /**
     * Find the latest user message in this conversation that has a
     * bank_proof payload, and return [bankProofArray, messageId]. Used by
     * the deposit_check state machine.
     */
    private function getLatestBankProofForConversation(): array
    {
        return $this->depositWithdrawManager->getLatestBankProofForConversation();
    }

    /**
     * Mark the result of the most recent deposit_check flow on the
     * username+group CRM memory, without storing any sensitive fields.
     */
    private function markDepositCheckResultOnUserMemory(string $status): void
    {
        $this->depositWithdrawManager->markDepositCheckResultOnUserMemory($status);
    }

    /**
     * Call BigMan username check API for the current conversation's group.
     * Returns true if username exists, false if not, and null on error.
     */
    private function checkUsernameWithBigman(string $username): ?bool
    {
        return $this->depositWithdrawManager->checkUsernameWithBigman($username);
    }

    private function resolveAiSettings(): array
    {
        $groupId = $this->conversation->group_id;

        $site = [];
        if ($groupId) {
            $site = GroupSettings::query()->where('group_id', $groupId)->value('settings') ?? [];
        }
        if (!is_array($site)) $site = [];

        $brand = (string) ($site['brandName'] ?? '');
        $brand = trim($brand) !== '' ? trim($brand) : self::DEFAULT_BRAND_NAME;

        $weeklyRebateDay = isset($site['weeklyRebateDay']) ? (string) $site['weeklyRebateDay'] : '';
        $weeklyRebateTime = isset($site['weeklyRebateTime']) ? (string) $site['weeklyRebateTime'] : '';

        $rtpLink = $site['rtpLinkInput'] ?? $site['rtpLink'] ?? null;
        if (is_string($rtpLink)) {
            $rtpLink = trim($rtpLink);
            if ($rtpLink === '') $rtpLink = null;
        }

        $websiteLink = $site['websiteLink'] ?? null;
        if (is_string($websiteLink)) {
            $websiteLink = trim($websiteLink);
            if ($websiteLink === '') $websiteLink = null;
        }

        $depositLimits = $this->buildLimits($site['minDeposit'] ?? null, $site['maxDeposit'] ?? null);
        $withdrawLimits = $this->buildLimits($site['minWithdrawal'] ?? null, $site['maxWithdrawal'] ?? null);

        $banks = $this->normalizeList($site['banks'] ?? null);
        $ewallets = $this->normalizeList($site['ewallets'] ?? null);
        $qris = (bool) ($site['qris'] ?? false);

        $promotions = [];
        if ($groupId) {
            $promotions = GroupPromotion::query()
                ->where('group_id', $groupId)
                ->where('active', true)
                ->orderBy('id', 'desc')
                ->get()
                ->map(function (GroupPromotion $p) {
                    return [
                        'id' => $p->id,
                        'title' => $p->title,
                        'description' => $p->description,
                        'code' => $p->code,
                        'discount' => $p->discount,
                        'terms' => $this->normalizeLinesOrJsonArray($p->terms),
                        'howToClaim' => $this->normalizeLinesOrJsonArray($p->how_to_claim),
                    ];
                })
                ->values()
                ->all();
        }

        $overrides = [];
        if ($groupId) {
            // Use the Eloquent model so attribute casts are applied (overrides is cast to array)
            $record = GroupAiAgentSettings::query()->where('group_id', $groupId)->first();
            $overrides = $record?->overrides ?? [];

            // Raw overrides debug: log exactly what was fetched from DB for troubleshooting
            try {
                Log::debug('ai-settings.rawOverrides', [
                    'group_id' => $groupId,
                    'record_exists' => $record ? true : false,
                    'record_overrides' => $record?->overrides ?? null,
                ]);
            } catch (\Throwable $_) { /* ignore */ }
        }
        if (!is_array($overrides)) $overrides = [];

        // Resolve assistant display name from group overrides or global aiAgent settings.
        // Precedence: group override name > global aiAgent.name > hardcoded default.
        $assistantName = null;
        $globalAiSettings = [];
        try {
            $globalAiSettings = settings('aiAgent') ?? [];
        } catch (\Throwable $_) {
            $globalAiSettings = [];
        }
        if (!is_array($globalAiSettings)) {
            $globalAiSettings = [];
        }
        $assistantName = Arr::get($overrides, 'name', Arr::get($globalAiSettings, 'name', 'AI assistant'));
        if (!is_string($assistantName) || trim($assistantName) === '') {
            $assistantName = 'AI assistant';
        } else {
            $assistantName = trim($assistantName);
        }

        // Map group AI "personality" override into Chat Buddy's aiBehaviour field.
        $aiBehaviour = $overrides['personality'] ?? $overrides['customRules'] ?? '';
        if (!is_string($aiBehaviour)) $aiBehaviour = '';

        $userIdRequestTemplates = self::DEFAULT_USER_ID_REQUEST_TEMPLATES;
        $overrideTemplates = Arr::get($overrides, 'userIdRequestTemplates', []);
        if (is_array($overrideTemplates)) {
            foreach (['deposit', 'withdraw', 'turnover', 'password_reset', 'claim', 'qris', 'generic'] as $k) {
                $v = $overrideTemplates[$k] ?? null;
                if (is_string($v) && trim($v) !== '') {
                    $userIdRequestTemplates[$k] = trim($v);
                }
            }
        }

        try {
            Log::debug('ai-settings.userIdRequestTemplates', [
                'group_id' => $groupId,
                'templates' => $userIdRequestTemplates,
            ]);
            Log::debug('ai-settings.depositFlowOverride', [
                'group_id' => $groupId,
                'depositFlow' => Arr::get($overrides, 'depositFlow', null),
            ]);
        } catch (\Throwable $_) { /* ignore */ }

        return [
            'brandName' => $brand,
            'welcomeMessage' => $site['welcomeMessage'] ?? null,
            'weeklyRebateDay' => $weeklyRebateDay,
            'weeklyRebateTime' => $weeklyRebateTime,
            'websiteLink' => $websiteLink,
            'rtpLink' => $rtpLink,
            'depositLimits' => $depositLimits,
            'withdrawLimits' => $withdrawLimits,
            'promotions' => $promotions,
            'banks' => $banks,
            'ewallets' => $ewallets,
            'qris' => $qris,
            'paymentMethods' => $banks,
            'assistantName' => $assistantName,
            'aiBehaviour' => $aiBehaviour,
            'customMessages' => Arr::get($overrides, 'customMessages', null),
            'waitMessage' => Arr::get($overrides, 'waitMessage', null),
            'userIdRequestTemplates' => $userIdRequestTemplates,
            // carry through aggregator config if present
            'aggregator' => Arr::get($overrides, 'aggregator', null),
            'rtpReplyTemplates' => $this->normalizeLinesOrJsonArray(Arr::get($overrides, 'rtpReplyTemplates', self::DEFAULT_RTP_TEMPLATES)),
            // deposit flow templates (optional group override)
            'depositFlow' => is_array(Arr::get($overrides, 'depositFlow', null)) ? Arr::get($overrides, 'depositFlow') : null,
        ];
    }

    private function buildLimits($min, $max): ?array
    {
        $minVal = $this->toNumberOrNull($min);
        $maxVal = $this->toNumberOrNull($max);

        if ($minVal === null && $maxVal === null) return null;

        return [
            'min' => $minVal,
            'max' => $maxVal,
        ];
    }

    private function toNumberOrNull($value): int|float|null
    {
        if ($value === null || $value === '') return null;
        if (is_int($value) || is_float($value)) return $value;
        if (is_string($value)) {
            $v = trim($value);
            if ($v === '') return null;
            if (is_numeric($v)) return $v + 0;
        }
        return null;
    }

    private function normalizeList($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(fn($v) => is_string($v) ? trim($v) : '', $value), fn($v) => $v !== ''));
        }
        if (is_string($value)) {
            $lines = preg_split('/\r\n|\r|\n/', $value);
            $lines = array_map(fn($l) => trim((string) $l), $lines ?: []);
            return array_values(array_filter($lines, fn($l) => $l !== ''));
        }
        return [];
    }

    private function normalizeLinesOrJsonArray($value): array
    {
        if ($value === null) return [];
        if (is_array($value)) return array_values($value);
        if (!is_string($value)) return [];

        $s = trim($value);
        if ($s === '') return [];

        // Try JSON array first
        if (str_starts_with($s, '[')) {
            try {
                $decoded = json_decode($s, true);
                if (is_array($decoded)) {
                    return array_values(array_filter(array_map(fn($v) => is_string($v) ? trim($v) : (string) $v, $decoded), fn($v) => $v !== ''));
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        // Fallback: newline-separated
        $lines = preg_split('/\r\n|\r|\n/', $s);
        $lines = array_map(fn($l) => trim((string) $l), $lines ?: []);
        return array_values(array_filter($lines, fn($l) => $l !== ''));
    }

    private function getEffectiveAggWindowMs(): int
    {
        $groupId = $this->conversation->group_id;

        // 1) group override: overrides.aggregator.windowMs
        if ($groupId) {
            $overrides = GroupAiAgentSettings::query()->where('group_id', $groupId)->value('overrides') ?? [];
            if (is_array($overrides)) {
                $candidates = [
                    Arr::get($overrides, 'aggregator.windowMs'),
                    Arr::get($overrides, 'aggregatorWindowMs'),
                    Arr::get($overrides, 'agg_window_ms'),
                    Arr::get($overrides, 'aggregator.agg_window_ms'),
                    Arr::get($overrides, 'aggregator.window_ms'),
                ];
                foreach ($candidates as $c) {
                    $n = is_numeric($c) ? (int) $c : null;
                    if ($n !== null && $n >= 0) return $n;
                }
            }
        }

        // 2) env overrides
        $env1 = env('LIVECHAT_BATCH_WINDOW_MS');
        if (is_numeric($env1) && (int) $env1 > 0) return (int) $env1;
        $env2 = env('AGG_WINDOW_MS');
        if (is_numeric($env2) && (int) $env2 > 0) return (int) $env2;

        return self::DEFAULT_AGG_WINDOW_MS;
    }

    private function detectIntent(string $text): string
    {
        return $this->intentManager->detectIntent($text);
    }

    private function extractUserId(?string $text): ?string
    {
        return $this->userIdFlowManager->extractUserId($text);
    }

    private function replaceUserIdPlaceholder(?string $template, ?string $userId): ?string
    {
        return $this->userIdFlowManager->replaceUserIdPlaceholder($template, $userId);
    }

    private function resolveWaitMessage(array $aiSettings, ?string $userId): string
    {
        return $this->userIdFlowManager->resolveWaitMessage($aiSettings, $userId);
    }

    private function containsWaitCue(?string $text): bool
    {
        if (!$text) return false;
        return (bool) preg_match('/\b(mohon\s+ditunggu|ditunggu\s+sebentar|please\s+wait|tunggu\s+sebentar|lagi\s+(?:dicek|diproses)|sedang\s+(?:dicek|diproses)|kami\s+cek|akan\s+dicek)\b/i', mb_strtolower($text));
    }

    private function isAffirmativeReply(?string $text): bool
    {
        return $this->userIdFlowManager->isAffirmativeReply($text);
    }

    private function isNegativeReply(?string $text): bool
    {
        return $this->userIdFlowManager->isNegativeReply($text);
    }

    private function classifyDiffNameReply(?string $text): ?bool
    {
        return $this->userIdFlowManager->classifyDiffNameReply($text);
    }

    private function tokenizeWords(string $text): array
    {
        return $this->intentManager->tokenizeWords($text);
    }

    private function containsApprox(array $tokens, array $keywords, int $maxDistance = 1): bool
    {
        return $this->intentManager->containsApprox($tokens, $keywords, $maxDistance);
    }

    private function isFrustrationMessage(string $text): bool
    {
        return $this->intentManager->isFrustrationMessage($text);
    }

    private function detectUserIdFlowType(string $text): string
    {
        return $this->userIdFlowManager->detectUserIdFlowType($text);
    }

    private function resolveUserIdRequestMessage(string $flowType = 'generic', array $aiSettings = []): string
    {
        return $this->userIdFlowManager->resolveUserIdRequestMessage($flowType, $aiSettings);
    }

    private function replyAsksForUserId(?string $text): bool
    {
        return $this->userIdFlowManager->replyAsksForUserId($text);
    }

    private function requiresUserIdFlow(string $flowType, string $text): bool
    {
        return $this->userIdFlowManager->requiresUserIdFlow($flowType, $text);
    }

    private function looksAccountSpecificTurnover(string $text): bool
    {
        return $this->userIdFlowManager->looksAccountSpecificTurnover($text);
    }

    /**
     * PHP port of Chat Buddy buildReply (LLM + JSON parse + userId flow enforcement).
     */
    private function buildReply(array $params): array
    {
        $text = (string) ($params['text'] ?? '');
        $rawText = $text;

        // Normalize noisy user input (typos, slang) and get a coarse intent
        // plus routing hint. This runs before regex-based intent detection and
        // USER-ID flow logic so we can avoid misfires on messy text.
        $norm = $this->normalizeUserInputForRouting($text);
        $normalizedText = isset($norm['normalized_text']) && is_string($norm['normalized_text']) && trim($norm['normalized_text']) !== ''
            ? (string) $norm['normalized_text']
            : $text;
        $normalizedText = trim($normalizedText) !== '' ? $normalizedText : $text;
        $coarseIntent = isset($norm['coarse_intent']) && is_string($norm['coarse_intent'])
            ? trim(mb_strtolower((string) $norm['coarse_intent']))
            : 'other';
        $routeHint = isset($norm['route']) && is_string($norm['route'])
            ? $norm['route']
            : 'general';
        $normConfidence = isset($norm['confidence']) && is_numeric($norm['confidence'])
            ? max(0.0, min(1.0, (float) $norm['confidence']))
            : 0.0;

        $aiSettings = (array) ($params['aiSettings'] ?? []);

        // load per-group deposit flow templates, fallback to hard-coded
        // IMPORTANT: use a helper that checks for non-empty string so that
        // saved empty-string values ("") do not bypass the default, which
        // would otherwise happen with plain ?? (null-coalescing only guards null).
        $depositFlow = is_array($aiSettings['depositFlow'] ?? null) ? $aiSettings['depositFlow'] : [];
        $resolveDepositTpl = static function (array $flow, string $key, string $default): string {
            $v = $flow[$key] ?? null;
            return (is_string($v) && trim($v) !== '') ? trim($v) : $default;
        };
        $tplAskUsername   = $resolveDepositTpl($depositFlow, 'askUsername',   'Bos, boleh minta UserID akun kamu dulu? 1 kata saja (tanpa spasi), biar aku bisa bantu cek semua lebih gampang 🙏');
        $tplAskProof      = $resolveDepositTpl($depositFlow, 'askProof',      'Sekarang kirim bukti transfer (screenshot struk/bukti deposit) yang jelas supaya bisa dicek otomatis ke sistem ya. 🙏');
        $tplProofMissing  = $resolveDepositTpl($depositFlow, 'proofMissing',  'Aku belum lihat bukti transfernya nih bos. Kirim screenshot struk/bukti deposit yang jelas (nominal dan rekening terlihat), nanti aku bantu cek otomatis ya. 🙏');
        $tplChecking      = $resolveDepositTpl($depositFlow, 'checking',      'Bukti deposit kamu lagi dicek ke sistem ya bos, mohon tunggu sebentar. Nanti kalau sudah ada hasil aku kabari. 🙏');
        $tplDoneResolved  = $resolveDepositTpl($depositFlow, 'doneResolved',  'Oke bosku, bukti deposit kamu sudah terdeteksi dan cocok di sistem. Biasanya sebentar lagi saldo akan masuk, kalau masih belum juga kabari aku lagi ya. 🙏');
        $tplDoneUnresolved= $resolveDepositTpl($depositFlow, 'doneUnresolved','Dari hasil cek otomatis, bukti deposit ini belum ketemu jelas di sistem. Aku teruskan ke tim CS supaya dicek manual ya, mohon tunggu sebentar dan jangan kirim deposit baru dulu. 🙏');
        $intent = $params['intent'] ?? null;
        $systemPrompt = (string) ($params['systemPrompt'] ?? '');
        $groupId = (string) ($params['groupId'] ?? '');
        $wasAwaiting = (bool) ($params['wasAwaiting'] ?? false);
        $lastUserIdFlowType = isset($params['lastUserIdFlowType']) && is_string($params['lastUserIdFlowType'])
            ? trim($params['lastUserIdFlowType'])
            : null;
        $resumeMode = isset($params['resumeMode']) ? (bool) $params['resumeMode'] : false;

        $initialIntent = is_string($intent) ? mb_strtolower($intent) : '';

        // ------------------------------------------------------------------
        // Early username collection flow (generic CRM-style, not tied
        // directly to USER-ID transaction flows). This runs before any
        // promotion/limits quick paths or LLM calls.
        // ------------------------------------------------------------------
        $session = null;
        $sessionContext = [];
        try {
            $session = $this->conversation->aiAgentSession()->firstOrCreate(
                ['conversation_id' => $this->conversation->id],
                ['status' => AiAgentSession::STATUS_ACTIVE, 'context' => []],
            );
            $sessionContext = is_array($session->context ?? null) ? $session->context : [];
        } catch (\Throwable $_) {
            $session = null;
            $sessionContext = [];
        }

        $confirmedUsername = isset($sessionContext['confirmed_username'])
            && is_string($sessionContext['confirmed_username'])
            && trim($sessionContext['confirmed_username']) !== ''
            ? trim($sessionContext['confirmed_username'])
            : null;
        $awaitingUsername = (bool) ($sessionContext['awaiting_username'] ?? false);

        $bpResult = $this->depositWithdrawManager->handleAwaitingBankProofAccountName($rawText, $sessionContext, $session);
        if ($bpResult) {
            return $bpResult;
        }

        // If BigMan previously reported no ticket found, we ask whether registered
        // name differs from transfer name, and if yes we retry with is_diff_name=true.
        $diffResult = $this->depositWithdrawManager->handleAwaitingBigmanDiffName($rawText, $sessionContext, $session);
        if ($diffResult) {
            return $diffResult;
        }

        $usernameResult = $this->userIdFlowManager->handleUsernameCollectionFlow(
            $rawText,
            $normalizedText,
            $aiSettings,
            $routeHint,
            $coarseIntent,
            $initialIntent,
            $tplAskUsername,
            $tplAskProof,
            $sessionContext,
            $session,
            $resumeMode,
            $wasAwaiting
        );
        if ($usernameResult) {
            return $usernameResult;
        }

        // ------------------------------------------------------------------
        // Deposit-check state machine (reuses confirmed_username and
        // leverages existing bank proof + BigMan integration). This runs
        // before generic promotion/limits quick paths and before LLM.
        // ------------------------------------------------------------------
        try {
            $depositFlowTemplates = [
                'proofMissing' => $tplProofMissing,
                'checking' => $tplChecking,
                'doneResolved' => $tplDoneResolved,
                'doneUnresolved' => $tplDoneUnresolved,
            ];

            $depositResult = $this->depositWithdrawManager->handleDepositCheckStateMachine(
                $rawText,
                $aiSettings,
                $confirmedUsername,
                $lastUserIdFlowType,
                $awaitingUsername,
                $sessionContext,
                $session,
                $depositFlowTemplates
            );

            if ($depositResult) {
                return $depositResult;
            }
        } catch (\Throwable $_) {
            // best-effort only; do not block normal flow
        }

        // Local quick-path: if the user is asking about promotions and we have
        // promotion data in AI settings, return a titles-only list formatted as
        // a simple bullet list ("- title") and skip the LLM entirely. This
        // ensures consistent list-only responses and avoids model drift, while
        // also avoiding ordered-list numbering quirks in some renderers.
        //
        // However, questions specifically about WEEKLY BONUS / REBATE SCHEDULE
        // (e.g. "kapan bonus mingguan dibagikan?", "weekly rebate kapan masuk?")
        // MUST be handled by the LLM so it can use the configured
        // weeklyRebateDay / weeklyRebateTime values from the system prompt.
        try {
            $localIntent = $this->detectIntent($normalizedText);
            $promotions = $aiSettings['promotions'] ?? [];

            // If this message looks like a PROMOTION CLAIM (i.e. routed into the
            // userid_collection + claim flow, or classified by the router as
            // promo_claim), we MUST NOT short-circuit into the generic promotion
            // list. Instead, the generic USER-ID enforcement later in this
            // method will apply the operator-configured **claim** template.
            // This keeps behaviour consistent with the "CLAIM FLOW (ABSOLUTE
            // LOCK)" section of the system prompt.
            // For claim-flow detection, use the original raw text so we
            // don't depend on how the router rewrote/normalized it.
            $flowGuardType = $this->detectUserIdFlowType($rawText);
            $isClaimFlow = ($flowGuardType === 'claim') || ($coarseIntent === 'promo_claim');

            if (!$isClaimFlow && ($initialIntent === 'promotion' || $localIntent === 'promotion') && is_array($promotions) && count($promotions) > 0) {
                $t = mb_strtolower($normalizedText);
                $looksLikeWeeklyRebateScheduleQuestion =
                    (bool) preg_match('/(bonus\s+mingguan|weekly\s+rebate|rebate\s+mingguan)/u', $t) &&
                    (bool) preg_match('/(kapan|jam|masuk|dibagikan)/u', $t);

                // If it's a weekly rebate schedule question, skip the promo-list
                // shortcut and let the LLM answer using the WEEKLY BONUS section.
                if ($looksLikeWeeklyRebateScheduleQuestion) {
                    // fall through to LLM handling
                } else {
                    $lines = [];
                    foreach ($promotions as $p) {
                        $title = is_array($p) ? ($p['title'] ?? '') : (is_object($p) ? ($p->title ?? '') : '');
                        if (!is_string($title) || trim($title) === '') continue;
                        $lines[] = sprintf('%d. %s', count($lines) + 1, trim((string) $title));
                    }
                    if (!empty($lines)) {
                        try { Log::debug('ai-agent.promotionListSent', ['conversation_id' => $this->conversation->id ?? null, 'promotions' => $promotions]); } catch (\Throwable $_) { }
                        return [
                            'reply' => implode("\n", $lines),
                            'intent' => 'promotion',
                            'context' => ['promotion_listed' => true],
                        ];
                    }
                }
            }
        } catch (\Throwable $_) { /* ignore and fall through to LLM */ }

        // Local quick-path: deposit/withdraw limits queries
        try {
            $limitsReply = $this->depositWithdrawManager->tryHandleDepositWithdrawLimitsQuery($normalizedText, $aiSettings);
            if ($limitsReply) {
                return $limitsReply;
            }
        } catch (\Throwable $_) { /* ignore */ }

        // Local quick-path: direct RTP link request ("link rtp")
        try {
            $t = mb_strtolower($normalizedText);
            $asksRtpLink = (bool) preg_match('/\b(link\s*rtp|rtp\s*link|minta\s*link\s*rtp)\b/u', $t);
            if ($asksRtpLink) {
                $link = $aiSettings['rtpLink'] ?? null;
                $reply = is_string($link) && trim($link) !== '' ? (string) $link : 'Link RTP belum tersedia.';
                return [
                    'reply' => $reply,
                    'intent' => 'rtp',
                    'context' => [
                        'rtpLink' => $link,
                        'awaitingUserId' => false,
                        'processing' => false,
                    ],
                ];
            }
        } catch (\Throwable $_) { /* ignore */ }

        // Frustration guard: if user is venting and mentions deposit/withdraw,
        // avoid activating operational flows and respond calmly.
        try {
            $t = mb_strtolower($text);
            $mentionsDepOrWd = (bool) preg_match('/\b(deposit|depo|deponya|wd|withdraw|withdrawal|top\s?up|topup|isi\s*saldo|tarik|penarikan)\b/u', $t);
            if ($mentionsDepOrWd && $this->isFrustrationMessage($text)) {
                return [
                    'reply' => 'Maaf ya, aku paham kamu lagi kesal. Kalau mau dibantu cek, jelasin singkat masalahnya — aku bantu pelan tanpa minta USER ID dulu. 🙏',
                    'intent' => 'anger',
                    'context' => [
                        'awaitingUserId' => false,
                        'processing' => false,
                    ],
                ];
            }
        } catch (\Throwable $_) { /* ignore */ }

        $providedMessages = $params['messages'] ?? null;
        $messages = (is_array($providedMessages) && !empty($providedMessages))
            ? $providedMessages
            : [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $normalizedText],
            ];

        // If we received a pre-built messages array from the caller, patch the
        // latest user message so the model sees both original and normalized
        // text. This helps intent understanding while still preserving what
        // the user actually typed.
        if (is_array($providedMessages) && !empty($providedMessages)) {
            for ($i = count($messages) - 1; $i >= 0; $i--) {
                if (!isset($messages[$i]['role']) || $messages[$i]['role'] !== 'user') {
                    continue;
                }
                $messages[$i]['content'] = "Original user message: \"{$rawText}\"\n\n"
                    . "Normalized interpretation: \"{$normalizedText}\"";
                break;
            }
        }

        $parsed = $this->routingManager->parseAssistantReply(
            $messages,
            $intent,
            $this->activityLogContext(),
        );

        if (!is_array($parsed) || !isset($parsed['reply'])) {
            return [
                'reply' => '',
                'intent' => $intent ?: 'general',
                'context' => [
                    'groupId' => $groupId,
                    'brand' => (string) ($aiSettings['brandName'] ?? 'GoodCasino'),
                    'limits' => null,
                    'rtpLink' => $aiSettings['rtpLink'] ?? null,
                    'websiteLink' => $aiSettings['websiteLink'] ?? null,
                    'promotion' => null,
                ],
            ];
        }

        if (!isset($parsed['intent'])) {
            $parsed['intent'] = $intent ?: 'general';
        }

        if (!isset($parsed['context']) || !is_array($parsed['context'])) {
            $parsed['context'] = [];
        }

        $parsed['context']['groupId'] = (string) ($groupId ?: ($parsed['context']['groupId'] ?? ''));
        $parsed['context']['brand'] = (string) (($aiSettings['brandName'] ?? null) ?: ($parsed['context']['brand'] ?? 'GoodCasino'));
        $parsed['context']['rtpLink'] = (is_string($aiSettings['rtpLink'] ?? null) && trim((string) $aiSettings['rtpLink']) !== '')
            ? trim((string) $aiSettings['rtpLink'])
            : (($aiSettings['rtpLink'] ?? null) !== null ? (string) ($aiSettings['rtpLink']) : null);

        $parsed['context']['websiteLink'] = (is_string($aiSettings['websiteLink'] ?? null) && trim((string) $aiSettings['websiteLink']) !== '')
            ? trim((string) $aiSettings['websiteLink'])
            : (($aiSettings['websiteLink'] ?? null) !== null ? (string) ($aiSettings['websiteLink']) : null);

        if (!array_key_exists('limits', $parsed['context'])) $parsed['context']['limits'] = null;
        if (!array_key_exists('promotion', $parsed['context'])) $parsed['context']['promotion'] = null;

        // Soft-sell guard: if the model attempts to promote deposits/promotions in a general/off-topic exchange,
        // attempt to rewrite the reply into a friendly, non-pressuring soft-sell using an LLM; if that fails, suppress.
        try {
            $replyLower = mb_strtolower((string) ($parsed['reply'] ?? ''));
            $promoKeywords = ['deposit','depo','bonus','promo','klaim','claim','daftar','gabung','topup','top up','isi saldo','isi_saldo'];
            $askedPromotion = ($initialIntent === 'promotion') || ($this->detectIntent($normalizedText) === 'promotion') || (isset($parsed['intent']) && mb_strtolower((string)$parsed['intent']) === 'promotion');
            $hasPromoText = (bool) preg_match('/\b(' . implode('|', array_map('preg_quote', $promoKeywords)) . ')\b/u', $replyLower);

            // Never soft-sell-suppress a reply that is part of a USER-ID
            // collection flow (claim, deposit, withdraw, etc.). The reply
            // IS the configured operator template and must be delivered
            // verbatim. Without this guard, messages like
            // "Saya Ingin Klaim Garansi kekalahan" trigger the claim
            // template (which contains "klaim"), but detectIntent() returns
            // 'general' for them (no "bonus" keyword), so $askedPromotion=false
            // and the guard would suppress the template.
            $isUserIdCollectionReply = ($flowType !== 'generic' && $this->requiresUserIdFlow($flowType, $rawText))
                || $coarseIntent === 'promo_claim'
                || (isset($parsed['intent']) && in_array(mb_strtolower((string) $parsed['intent']), ['userid_collection','processing'], true));

            if (!$askedPromotion && !$isUserIdCollectionReply && $hasPromoText) {
                $originalReply = trim((string) ($parsed['reply'] ?? ''));
                $rewritten = null;
                try {
                    $rewritten = $this->rewriteSoftSellUsingLlm($originalReply, $aiSettings ?? [], $rawText);
                } catch (\Throwable $e) {
                    // best-effort only
                }

                if (is_string($rewritten) && trim($rewritten) !== '') {
                    $parsed['reply'] = $rewritten;
                    $parsed['intent'] = $parsed['intent'] ?? 'general';
                    $parsed['context']['soft_sell_rewritten'] = true;
                    $parsed['context']['soft_sell_original'] = mb_substr($originalReply, 0, 1000);
                    try { Log::info('Soft-sell rewrite applied', ['conversation_id' => $this->conversation->id ?? null]); } catch (\Throwable $e) { /* ignore */ }
                } else {
                    // Fallback suppression message
                    $parsed['reply'] = 'Hai! Kalau mau tanya tentang promo atau cara deposit, bilang aja ya — aku bantu santai kok. 🙌';
                    $parsed['intent'] = $parsed['intent'] ?? 'general';
                    $parsed['context']['soft_sell_suppressed'] = true;
                }
            }
        } catch (\Throwable $e) {
            // ignore - best effort only
        }

        // UserID flow enforcement
        $extractedUserId = null;
        $shouldInjectWaitMessage = false;
        $finalIntent = '';
        $awaiting = false;

        try {
            $finalIntent = mb_strtolower((string) ($parsed['intent'] ?? $intent ?? ''));
            // Only trust "awaitingUserId" if it comes from prior conversation
            // state, not from the model's current guess. This prevents first-time
            // messages from jumping straight into processing/wait flows.
            if ($wasAwaiting) {
                $awaiting = true;
                $parsed['context']['awaitingUserId'] = true;
            } else {
                $awaiting = false;
                $parsed['context']['awaitingUserId'] = false;
            }

            // If resuming from a support handoff/lock, clear any lingering flags
            // so neutral messages don't re-trigger processing or collection.
            if ($resumeMode) {
                $awaiting = false;
                $parsed['context']['awaitingUserId'] = false;
                $parsed['context']['processing'] = false;
                if (isset($parsed['context']['userIdFlowType'])) {
                    unset($parsed['context']['userIdFlowType']);
                }
                if (in_array($finalIntent, ['userid_collection','processing','still_processing'], true)) {
                    $finalIntent = 'general';
                    $parsed['intent'] = 'general';
                    // keep whatever reply text, but ensure we don't escalate
                    $parsed['status'] = $parsed['status'] ?? 'greeting';
                }
            }

            // Only enforce USER ID extraction when our local intent detection indicates a USERID flow
            // or when the model explicitly indicates we are awaiting a USER ID. This prevents
            // accidental extraction on greetings when the model mislabels intent.
            // Use the original raw text for flow-type detection so we are
            // consistent with how helpers like test_claim_message.php call it.
            $flowType = $this->detectUserIdFlowType($rawText);
            if ($flowType === 'generic' && is_string($lastUserIdFlowType) && $lastUserIdFlowType !== '') {
                // Preserve previously active flow type (e.g. claim/turnover) when user replies
                // with a short acknowledgement like "iya" atau "sambungkan dengan manusia".
                $flowType = $lastUserIdFlowType;
            }

            // If the router classified this as an explicit promotion-claim
            // request, force the USER-ID flow type to "claim" so we always
            // use the operator-configured **claim** template instead of the
            // generic one.
            if ($coarseIntent === 'promo_claim') {
                $flowType = 'claim';
            }

            // Only allow hard USER-ID / processing flows when the LLM pre-filter
            // also thinks this is an operational request (deposit/withdraw/etc.).
            // Also never enforce flows when coarse intent is clearly smalltalk,
            // unclear, or pure anger/rant.
            if ($routeHint === 'general' || in_array($coarseIntent, ['smalltalk','unclear','other','anger'], true)) {
                $enforceFlow = false;
            } else {
                $enforceFlow = $this->requiresUserIdFlow($flowType, $normalizedText);
            }
            // Untuk alur USER ID: hanya pindah ke status "processing" (dan kirim pesan tunggu)
            // kalau BENAR-BENAR sudah terdeteksi USER ID yang valid. Jika kita masih dalam
            // keadaan menunggu USER ID (awaiting=true) tapi pesan balasan user seperti
            // "halo bosku proses depo" tidak berisi USER ID yang jelas, tetap pertahankan
            // awaitingUserId=true dan biarkan logika di bawah mengirim ulang template
            // permintaan USER ID, bukan langsung pesan "lagi dicek" tanpa ID.
            if (!$resumeMode && ($awaiting || ($enforceFlow && ($finalIntent === 'userid_collection' || $initialIntent === 'userid_collection')))) {
                $maybe = $this->extractUserId($rawText);
                if ($maybe) {
                    // Hanya jika USER ID berhasil diekstrak kita kunci ke mode processing.
                    $extractedUserId = (string) $maybe;
                    $parsed['context']['userId'] = $extractedUserId;
                    $parsed['context']['awaitingUserId'] = false;
                    $parsed['context']['processing'] = true;
                    $parsed['status'] = 'processing';
                    if ($finalIntent === 'userid_collection') {
                        $parsed['intent'] = 'processing';
                    }
                    $shouldInjectWaitMessage = true;
                    // Ingat flow apa (deposit/withdraw/claim/dll) yang memakai USER ID ini.
                    if (!isset($parsed['context']['userIdFlowType'])) {
                        $parsed['context']['userIdFlowType'] = $flowType;
                    }
                } else {
                    // Tidak ada USER ID yang valid di teks sekarang.
                    // Jika sebelumnya kita memang sedang menunggu USER ID,
                    // maka khusus flow withdraw/password_reset/claim: balasan user apa pun lanjut
                    // ke WAIT/processing agar tidak re-prompt template.
                    // Flow lain tetap menunggu USER ID dan boleh re-prompt template.
                    if ($awaiting) {
                        $activeFlowType = is_string($lastUserIdFlowType) && $lastUserIdFlowType !== ''
                            ? mb_strtolower($lastUserIdFlowType)
                            : (is_string(Arr::get($parsed, 'context.userIdFlowType')) ? mb_strtolower((string) Arr::get($parsed, 'context.userIdFlowType')) : mb_strtolower((string) $flowType));

                        // Only escalate to processing (lock) for flows where we
                        // genuinely expect a USER ID and a human will need to take
                        // over – don't do this for a generic mis‑fire because then the
                        // conversation becomes stuck until an agent intervenes.
                        if (in_array($activeFlowType, ['withdraw', 'password_reset', 'claim', 'deposit', 'turnover','qris'], true)) {
                            $parsed['context']['awaitingUserId'] = false;
                            $parsed['context']['processing'] = true;
                            $parsed['status'] = 'processing';
                            $parsed['intent'] = 'processing';
                            $shouldInjectWaitMessage = true;
                            if (!isset($parsed['context']['userIdFlowType'])) {
                                $parsed['context']['userIdFlowType'] = $activeFlowType;
                            }
                        } else {
                            // stay in awaiting mode and continue prompting
                            $parsed['context']['awaitingUserId'] = true;
                            $parsed['context']['processing'] = false;
                            if (!isset($parsed['status']) || $parsed['status'] === '') {
                                $parsed['status'] = 'collecting_userid';
                            }
                            if (!isset($parsed['context']['userIdFlowType'])) {
                                $parsed['context']['userIdFlowType'] = $flowType;
                            }
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

            // Re-evaluate whether we're still awaiting a USER ID after extraction/processing
            $awaiting = (bool) Arr::get($parsed, 'context.awaitingUserId', false);

        if (!$resumeMode && $shouldInjectWaitMessage) {
            $currentReply = trim((string) ($parsed['reply'] ?? ''));
            $waitMessage = $this->resolveWaitMessage($aiSettings, $extractedUserId);

            if ($currentReply === '') {
                $parsed['reply'] = $waitMessage;
            } else {
                $replaced = $this->replaceUserIdPlaceholder($currentReply, $extractedUserId);
                if ($this->containsWaitCue($replaced)) {
                    $parsed['reply'] = $replaced;
                } else {
                    $parsed['reply'] = $waitMessage;
                }
            }
        }

        // Track whether we are already in processing state after USER-ID handling
        $processingActive = (bool) Arr::get($parsed, 'context.processing', false);
        if ($resumeMode) {
            $processingActive = false;
            $parsed['context']['processing'] = false;
        }

        // The caller does not currently supply an explicit intent (it's null), so
        // we must key off the model's intent/context to decide when to enforce
        // the USER-ID collection prompt. Again, use the raw text so behaviour
        // aligns with direct detectUserIdFlowType() calls.
        $flowType = $this->detectUserIdFlowType($rawText);
        if ($flowType === 'generic' && is_string($lastUserIdFlowType) && $lastUserIdFlowType !== '') {
            $flowType = $lastUserIdFlowType;
        }

        // Map router-level promo_claim into the hard claim flow so that
        // promotion claim requests never fall back to the generic USER-ID
        // template.
        if ($coarseIntent === 'promo_claim') {
            $flowType = 'claim';
        }

        // Determine whether we should forcibly interrupt the normal LLM reply
        // and replace it with a USER‑ID collection prompt. This is one of the
        // most sensitive pieces of logic, so we keep the conditions as narrow as
        // possible to avoid locking the conversation when the user is simply
        // chatting or asking general questions.
        $needsUserIdPrompt =
            !$extractedUserId &&
            !$processingActive &&
            (
                // always honour an existing awaiting flag from the previous turn
                $awaiting ||

                // the model itself suggested we ask for a user id, but only act
                // on that suggestion if we also have independent evidence that it's
                // a valid operational flow. without the extra check the LLM could
                // hallucinate userid_collection and lock the conversation.
                (
                    $finalIntent === 'userid_collection'
                    && in_array($flowType, ['claim','withdraw','deposit','qris','password_reset','turnover'], true)
                ) ||

                // initialIntent comes from the caller (rarely used), keep it for
                // backwards compatibility but treat it similarly to finalIntent
                (
                    $initialIntent === 'userid_collection'
                    && in_array($flowType, ['claim','withdraw','deposit','qris','password_reset','turnover'], true)
                ) ||

                (
                    $routeHint === 'operational'
                    && !in_array($coarseIntent, ['smalltalk','unclear','other'], true)
                    && $this->requiresUserIdFlow($flowType, $normalizedText)
                ) ||

                // Local heuristic bypass: if our own detectors classify this as
                // a hard USER-ID flow (claim/deposit/withdraw/etc.), enforce the
                // template regardless of what the OpenAI router returned.
                // This covers messages like "Saya Ingin Klaim Garansi Kekalahan"
                // where the router may return route=general since it looks like
                // a bonus-check rather than a transactional deposit/withdraw.
                (
                    !in_array($coarseIntent, ['smalltalk','unclear','other','anger'], true)
                    && $flowType !== 'generic'
                    && $this->requiresUserIdFlow($flowType, $rawText)
                )
            );
        if ($resumeMode) {
            $needsUserIdPrompt = false;
        }
        if ($needsUserIdPrompt) {
            $currentReply = trim((string) ($parsed['reply'] ?? ''));
            // Do NOT re-detect flow type here; reuse the previously
            // computed value (based on rawText + router) so that flows
            // like "claim" are preserved and do not downgrade back to
            // "generic" due to normalization.
            if ($flowType === 'generic' && is_string($lastUserIdFlowType) && $lastUserIdFlowType !== '') {
                $flowType = $lastUserIdFlowType;
            }

            // Always enforce the operator-configured template for this flow.
            // Deposit flow has a separate set of templates, so prefer those when
            // appropriate instead of the generic userIdRequest message. This
            // keeps the two systems in sync and means overrides saved via the UI
            // actually take effect for deposit requests.
            if ($flowType === 'deposit') {
                // $tplAskUsername was computed earlier from aiSettings (group override or default)
                $template = $tplAskUsername;
            } else {
                $template = $this->resolveUserIdRequestMessage($flowType, $aiSettings);
            }
            $parsed['reply'] = $template;
            $parsed['intent'] = 'userid_collection';
            $parsed['status'] = 'collecting_userid';
            $parsed['context']['awaitingUserId'] = true;
            $parsed['context']['processing'] = false;
            $parsed['context']['userId'] = null;
            $parsed['context']['userIdFlowType'] = $flowType;
            if (!isset($parsed['context']['language'])) $parsed['context']['language'] = 'id';

            try { Log::debug('ai-agent.userIdPromptEnforced', ['conversation_id' => $this->conversation->id ?? null, 'flow' => $flowType, 'template' => mb_substr($template, 0, 500), 'override_templates' => Arr::get($aiSettings, 'userIdRequestTemplates', [])]); } catch (\Throwable $_) { /* ignore */ }
        }

        // As a final safety pass, normalize any numbered list lines in the reply
        // by converting them into simple bullet points. This avoids renderer
        // quirks where long ordered lists can restart numbering (e.g. after 9).
        if (isset($parsed['reply']) && is_string($parsed['reply'])) {
            $parsed['reply'] = $this->normalizeSequentialNumbering($parsed['reply']);
        }

        return $parsed;
    }

    /**
     * Convert ordered-list style lines ("1. ...", "2. ...") in a reply into
     * simple bullet lines ("- ...") so numbering can never repeat due to
     * markdown/HTML rendering quirks. This only affects presentation.
     */
    private function normalizeSequentialNumbering(string $reply): string
    {
        $lines = preg_split("/(\r\n|\r|\n)/", $reply);
        if ($lines === false || count($lines) === 0) {
            return $reply;
        }

        $seenAny = false;

        foreach ($lines as &$line) {
            // Match typical ordered-list syntax like "1. text" (optionally with extra spaces)
            if (preg_match('/^(\s*)(\d+)\.\s*(.*)$/u', $line, $m)) {
                // Replace with a simple bullet: "- text"
                $line = $m[1] . '- ' . $m[3];
                $seenAny = true;
            }
        }
        unset($line);

        if (!$seenAny) {
            return $reply;
        }

        return implode("\n", $lines);
    }

    private function stripMarkdownCodeFences(string $text): string
    {
        return $this->parser->stripMarkdownCodeFences($text);
    }

    /**
     * Use a lightweight LLM call to normalize noisy user input (typos/slang)
     * and get a coarse intent + routing hint.
     *
     * This is a pre-filter: it should be cheap and robust. If anything fails
     * (no API key, bad JSON, etc.), we fall back to the original text and
     * let the existing heuristics handle it.
     *
     * Return shape (best-effort):
     * [
     *   'normalized_text' => string,
     *   'coarse_intent' => string, // e.g. deposit|withdraw|turnover|promo|promo_claim|password_reset|qris|games|rtp|smalltalk|anger|unclear|other
     *   'route' => string,         // 'operational' (flows) or 'general'
     *   'confidence' => float,     // 0-1
     * ]
     */
    protected function normalizeUserInputForRouting(string $text): array
    {
        return $this->routingManager->normalizeUserInputForRouting(
            $text,
            $this->activityLogContext(),
        );
    }

    private function callOpenAiChatCompletion(array $messages, float $temperature, int $maxTokens): string
    {
        return $this->aiClient->callOpenAiChatCompletion(
            $messages,
            $temperature,
            $maxTokens,
            $this->activityLogContext(),
        );
    }

    private function activityLogContext(): array
    {
        $groupId = $this->conversation->group_id
            ? (int) $this->conversation->group_id
            : null;
        $agent = $this->resolveAiAgentRecordForActivity($groupId);

        return [
            'conversation_id' => $this->conversation->id,
            'group_id' => $groupId,
            'ai_agent_id' => $agent?->id,
            'agent_name' => $agent?->name ?? $this->resolveAssistantNameForActivity(),
        ];
    }

    private function resolveAiAgentRecordForActivity(?int $groupId): ?AiAgentRecord
    {
        $query = AiAgentRecord::query()->where('enabled', true);

        if ($groupId) {
            $groupAgent = (clone $query)
                ->where('group_id', $groupId)
                ->orderBy('id')
                ->first();

            if ($groupAgent) {
                return $groupAgent;
            }
        }

        return $query
            ->whereNull('group_id')
            ->orderBy('id')
            ->first();
    }

    private function resolveAssistantNameForActivity(): string
    {
        $groupId = $this->conversation->group_id
            ? (int) $this->conversation->group_id
            : null;
        $overrides = [];

        if ($groupId) {
            try {
                $record = GroupAiAgentSettings::query()
                    ->where('group_id', $groupId)
                    ->first();
                $overrides = $record?->overrides ?? [];
            } catch (\Throwable $_) {
                $overrides = [];
            }
        }

        if (!is_array($overrides)) {
            $overrides = [];
        }

        try {
            $global = settings('aiAgent') ?? [];
        } catch (\Throwable $_) {
            $global = [];
        }

        if (!is_array($global)) {
            $global = [];
        }

        $name = Arr::get($overrides, 'name', Arr::get($global, 'name', 'AI assistant'));
        $name = is_string($name) ? trim($name) : '';

        return $name !== '' ? $name : 'AI assistant';
    }

    /**
     * Exact prompt text ported from Chat Buddy composeSystemPromptFull (with variable interpolation).
     */
    private function composeSystemPromptFull(array $s): string
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

        // Build RTP templates block from settings override or defaults.
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

        // Build promotions list text
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

    /**
     * Best-effort LLM rewriter that converts a promotional/hard-sell reply into a soft-sell, friendly message.
     * Tries the LLM up to two times, with a stricter retry if needed. If LLM is unavailable or returns CTAs,
     * falls back to local safe templates so we always return a friendly, non-pressuring message.
     */
    private function rewriteSoftSellUsingLlm(string $original, array $aiSettings = [], string $userText = ''): ?string
    {
        return $this->softSellManager->rewriteSoftSellUsingLlm($original, $aiSettings, $userText);
    }
}
