<?php

namespace Ai\AiAgent\Conversations;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class AIUserIdFlowManager
{
    private const DEFAULT_USER_ID_REQUEST_TEMPLATES = [
        'turnover' => 'Boleh minta USER ID-nya? Biar saya cek turnover-nya 📊. NOTE: USER ID cukup 1 kata ya.',
        'withdraw' => 'Boleh minta USER ID-nya? Biar saya cek status withdraw kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
        'deposit' => 'Boleh minta USER ID-nya? Biar saya cek status deposit kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
        'password_reset' => 'Boleh minta USER ID-nya? Biar saya bantu reset password-nya 🔐. NOTE: USER ID cukup 1 kata ya.',
        'claim' => 'Boleh minta USER ID-nya? Biar saya bantu klaim promonya 🎁. NOTE: USER ID cukup 1 kata ya.',
        'qris' => 'Boleh minta USER ID-nya? Biar saya cek pembayaran QRIS-mu 🎯. NOTE: USER ID cukup 1 kata ya.',
        'generic' => 'Boleh minta USER ID-nya? Biar saya bantu prosesnya 🎰. NOTE: USER ID cukup 1 kata ya.',
    ];

    public function __construct(protected Conversation $conversation) {}

    public function extractUserId(?string $text): ?string
    {
        if (!$text) return null;
        $str = trim($text);
        if ($str === '') return null;

        if (preg_match('/\b(user\s*id|userid|user_id|uid|account\s*id|cid)\b[:=\s-]*([A-Za-z0-9_-]{2,30})/i', $str, $m)) {
            return trim($m[2] ?? '') ?: null;
        }

        $parts = preg_split('/\s+/', $str) ?: [];
        $parts = array_values(array_filter($parts, fn($p) => trim((string)$p) !== ''));
        if (count($parts) === 1) {
            $word = trim($parts[0]);
            if (preg_match('/^[A-Za-z0-9_-]{3,20}$/', $word)) {
                $lower = mb_strtolower($word);
                // Avoid treating common greetings as USER IDs.
                if (in_array($lower, ['halo', 'hai', 'hi', 'hello', 'hey', 'assalamualaikum', 'salam', 'p'], true)) {
                    return null;
                }
                return $word;
            }
        }

        return null;
    }

    public function replaceUserIdPlaceholder(?string $template, ?string $userId): ?string
    {
        if (!$template || !$userId) return $template;
        return preg_replace(
            [
                '/\{\{\s*(user[_\s-]*id|userid|cid)\s*\}\}/i',
                '/\[\[\s*(user[_\s-]*id|userid|cid)\s*\]\]/i',
                '/%\s*(user[_\s-]*id|userid|cid)\s*%/i',
            ],
            $userId,
            $template,
        );
    }

    public function resolveWaitMessage(array $aiSettings, ?string $userId): string
    {
        $candidates = [];
        $customWait = Arr::get($aiSettings, 'customMessages.waitMessage');
        if (is_string($customWait) && trim($customWait) !== '') {
            $candidates[] = trim($customWait);
        }
        $waitMessage = Arr::get($aiSettings, 'waitMessage');
        if (is_string($waitMessage) && trim($waitMessage) !== '') {
            $candidates[] = trim($waitMessage);
        }

        $selected = null;
        foreach ($candidates as $c) {
            if ($c !== '') { $selected = $c; break; }
        }

        if ($selected) {
            return (string) $this->replaceUserIdPlaceholder($selected, $userId);
        }

        if ($userId) {
            return 'Oke, tunggu sebentar ya — lagi dicek. 🙏';
        }

        return 'Siap, permintaan kamu lagi dicek. Mohon ditunggu sebentar ya.';
    }

    public function containsWaitCue(?string $text): bool
    {
        if (!$text) return false;
        return (bool) preg_match('/\b(mohon\s+ditunggu|ditunggu\s+sebentar|please\s+wait|tunggu\s+sebentar|lagi\s+(?:dicek|diproses)|sedang\s+(?:dicek|diproses)|kami\s+cek|akan\s+dicek)\b/i', mb_strtolower($text));
    }

    public function isAffirmativeReply(?string $text): bool
    {
        $t = mb_strtolower(trim((string) $text));
        if ($t === '') return false;

        return (bool) preg_match(
            '/\b(ya|iya|iyaa|yaa|yes|yep|yup|betul|benar|bener|ok|oke|okey|sip|siap|setuju|lanjut|gas|go\s*ahead|confirm(ed)?)\b/u',
            $t,
        );
    }

    public function isNegativeReply(?string $text): bool
    {
        $t = mb_strtolower(trim((string) $text));
        if ($t === '') return false;

        return (bool) preg_match(
            '/\b(tidak|tdk|tak|bukan|salah|ga|gak|gk|engga|enggak|ngga|nggak|no|nope|not\s*now|jangan|ga\s*jadi|gak\s*jadi|nggak\s*jadi)\b/u',
            $t,
        );
    }

    public function classifyDiffNameReply(?string $text): ?bool
    {
        $t = mb_strtolower(trim((string) $text));
        if ($t === '') return null;

        if (preg_match('/\b(berbeda|beda|lain|different|tidak\s+sama|tak\s+sama|ga\s+sama|gak\s+sama|nggak\s+sama)\b/u', $t)) {
            return true;
        }
        if (preg_match('/\b(sama|same|identik|serupa|cocok)\b/u', $t)) {
            return false;
        }

        return null;
    }

    public function detectUserIdFlowType(string $text): string
    {
        $lower = mb_strtolower($text);
        $tokens = $this->tokenizeWords($text);
        if ($lower === '') return 'generic';

        // Claim/promo detection
        $hasExplicitClaim = (bool) preg_match('/\b(klaim|claim)\b/u', $lower);
        $hasFuzzyClaim = $this->containsApprox($tokens, ['klaim','claim'], 2) || in_array('klem', $tokens, true) || in_array('klim', $tokens, true) || in_array('kleim', $tokens, true);
        $hasClaimPhrases = (bool) preg_match('/\b(cara\s+(klaim|claim|redeem|tebus)|how\s+to\s+claim|claim\s+promo|kode\s+promo)\b/u', $lower);
        $hasActionWithPromo = (
            (bool) preg_match('/\b(ambil|ikut|join|daftar|redeem|tebus)\b/u', $lower)
            && (bool) preg_match('/\b(promo|promosi|bonus|voucher|kode|code)\b/u', $lower)
        );
        if ($hasExplicitClaim || $hasFuzzyClaim || $hasClaimPhrases || $hasActionWithPromo) {
            return 'claim';
        }

        // QRIS / payment code detection
        if (preg_match('/\b(qris|qris\b|kode\s+qris|nomor\s+qris|qr\s?code|qr\s?code)\b/u', $lower)) return 'qris';

        // Turnover / bonus progress detection
        $hasTurnoverKeyword =
            preg_match('/\b(turnover|turn\s*over|rollover|omset|omzet|perputaran|kelipatan|wager|wr)\b/u', $lower) ||
            (preg_match('/\bto\b/u', $lower) && preg_match('/\b(cek|progress|progres|bonus|sisa|udah|berapa|tinggal|rollover|wr|wager)\b/u', $lower));
        $hasFuzzyTurnover =
            $this->containsApprox($tokens, ['turnover','rollover','omset','omzet','wager','perputaran','kelipatan'], 2);
        if ($hasTurnoverKeyword || $hasFuzzyTurnover) return 'turnover';

        // Withdraw detection
        $hasPrimaryWithdrawKeyword = preg_match('/\b(withdraw|withdrawal|wd|w\/?d|cashout|tarik|penarikan|tarik\s*(saldo|dana)|penarikan\s*(saldo|dana))\b/u', $lower)
            || (bool) preg_match('/\bwd[a-z]{0,3}\b/u', $lower);
        $hasFuzzyWithdraw = $this->containsApprox($tokens, ['withdraw','withdrawal'], 2)
            || in_array('withdrw', $tokens, true) || in_array('withdaw', $tokens, true)
            || in_array('wthdraw', $tokens, true) || in_array('wtihdraw', $tokens, true);
        if ($hasFuzzyWithdraw) { $hasPrimaryWithdrawKeyword = true; }

        $hasCair = preg_match('/\b(cair|pencairan|cairkan|cairin)\b/u', $lower);

        if ($hasCair && !$hasPrimaryWithdrawKeyword) {
            $cairInBonusContext = preg_match('/\b(bonus\s+(mingguan|weekly)|weekly\s+bonus|rebate\s+mingguan|mingguan\s+rebate|rebate)\b/u', $lower);
            if ($cairInBonusContext) {
                return 'generic';
            }
            $cairInWithdrawContext = preg_match('/\b(wd|withdraw|withdrawal|nominal|pending|gagal|lama)\b/u', $lower);
            if (!$cairInWithdrawContext) {
                return 'generic';
            }
            $hasPrimaryWithdrawKeyword = true;
        }

        if ($hasPrimaryWithdrawKeyword || ($hasCair && !preg_match('/\b(bonus|weekly|rebate|mingguan)\b/u', $lower))) {
            $hasProblemKeyword =
                preg_match('/\b(gagal|pending|error|macet|stuck|ditolak|tolak|batal|cancel|antri|antre|queue|proses|diproses|process|processing)\b/u', $lower) ||
                preg_match('/\b(tidak\s+masuk|tdk\s+masuk|belum\s+masuk|blm\s+masuk)\b/u', $lower) ||
                preg_match('/\b(tidak\s+cair|tdk\s+cair|belum\s+cair|blm\s+cair)\b/u', $lower) ||
                preg_match('/\b(udah\s+lama|sudah\s+lama|kok\s+belum|kapan\s+masuk|kapan\s+cair)\b/u', $lower) ||
                preg_match('/\b(tidak\s+bisa|tdk\s+bisa|ga\s+bisa|gak\s+bisa|gk\s+bisa|ngga\s+bisa|nggak\s+bisa|can\'?t|cannot)\b/u', $lower) ||
                preg_match('/\b(kenapa|knapa|knp|mengapa|why)\b/u', $lower);

            if ($hasProblemKeyword) {
                return 'withdraw';
            }
            return 'generic';
        }

        // Deposit detection
        $hasDepositKeyword = preg_match('/\b(deposit|depo|deponya|dp|top\s?up|topup|isi saldo)\b/u', $lower)
            || $this->containsApprox($tokens, ['deposit','depo','deponya'], 1);
        if ($hasDepositKeyword) return 'deposit';

        // Password reset/login issues
        $tokens = $this->tokenizeWords($text);
        $hasForgot = (bool) preg_match('/\b(lupa|forgot|kelupaan)\b/u', $lower);
        $hasReset = (bool) preg_match('/\b(reset|ganti|ubah|change|update|perbarui|perbaharui)\b/u', $lower);
        $hasLoginProblem = (bool) preg_match('/\b(ga\s*bisa\s*(login|masuk)|gk\s*bisa\s*(login|masuk)|gak\s*bisa\s*(login|masuk)|tidak\s*bisa\s*(login|masuk))\b/u', $lower)
            || (bool) preg_match('/\b(login\s*(error|gagal|susah))\b/u', $lower)
            || (bool) preg_match('/\b(masuk\s*(error|gagal|susah))\b/u', $lower);
        $hasAccountLocked = (bool) preg_match('/\b(akun\s*(terkunci|kunci|locked))\b/u', $lower) || (bool) preg_match('/\b(account\s*(locked|blocked))\b/u', $lower);
        $pwApprox = $this->containsApprox($tokens, ['password','pass','pw','sandi','pswd','passwd','passwrd'], 2) ||
            ($this->containsApprox($tokens, ['kata'], 0) && $this->containsApprox($tokens, ['sandi'], 2));
        $hasLupaPass = (bool) preg_match('/\blupa\s+(password|pass|pas|pw|kata\s*sandi|sandi)\b/u', $lower) ||
                       (bool) preg_match('/\b(password|pass|pw|sandi|kata\s*sandi)\s*lupa\b/u', $lower);
        $hasResetPwPhrase = (bool) preg_match('/\b(reset|ubah|ganti|change|update|perbarui|perbaharui)\s*(password|pass|pw|sandi|kata\s*sandi)\b/u', $lower);
        $hasCantRememberPw = (bool) preg_match('/\b(ga|gk|gak|tidak|tak)\s*(ingat|inget|remember)\s*(password|pass|pw|sandi|kata\s*sandi)\b/u', $lower)
            || (bool) preg_match('/\b(can\'?t\s*remember)\s*(password|pass|pw)\b/u', $lower)
            || (bool) preg_match('/\b(forgotten)\s*(password|pass|pw)\b/u', $lower);
        $hasWrongPw = (bool) preg_match('/\b(password|sandi|pw|pass)\s*(salah|wrong|incorrect|error)\b/u', $lower);

        if ($hasLupaPass || $hasResetPwPhrase || $hasCantRememberPw || ($pwApprox && ($hasForgot || $hasReset)) || $hasLoginProblem || $hasAccountLocked || $hasWrongPw) {
            return 'password_reset';
        }

        return 'generic';
    }

    public function resolveUserIdRequestMessage(string $flowType = 'generic', array $aiSettings = []): string
    {
        $templates = Arr::get($aiSettings, 'userIdRequestTemplates', []);
        if (!is_array($templates)) $templates = [];

        $get = function (string $key): ?string {
            $value = self::DEFAULT_USER_ID_REQUEST_TEMPLATES[$key] ?? null;
            if (is_string($value) && trim($value) === '') {
                $value = null;
            }
            return $value;
        };

        $override = function (string $key) use ($templates, $get): string {
            $candidate = $templates[$key] ?? null;
            if (is_string($candidate) && trim($candidate) !== '') {
                return trim($candidate);
            }
            return (string) ($get($key) ?? '');
        };

        $selected = match ($flowType) {
            'turnover' => $override('turnover'),
            'withdraw' => $override('withdraw'),
            'deposit' => $override('deposit'),
            'password_reset' => $override('password_reset'),
            'claim' => $override('claim'),
            'qris' => $override('qris'),
            default => $override('generic'),
        };

        try {
            $isOverride = isset($templates[$flowType]) && is_string($templates[$flowType]) && trim((string) $templates[$flowType]) !== '';
            Log::debug('ai-agent.userIdTemplateSelected', [
                'conversation_id' => $this->conversation->id ?? null,
                'flow' => $flowType,
                'selected' => mb_substr((string) $selected, 0, 500),
                'override_applied' => $isOverride,
            ]);
        } catch (\Throwable $_) { /* ignore */ }

        return $selected;
    }

    /**
     * Handle username collection, confirmation, and the deposit-entry handoff.
     * Returns an immediate reply array when this flow consumes the message.
     */
    public function handleUsernameCollectionFlow(
        string $rawText,
        string $normalizedText,
        array $aiSettings,
        string $routeHint,
        string $coarseIntent,
        string $initialIntent,
        string $tplAskUsername,
        string $tplAskProof,
        array &$sessionContext,
        ?object $session,
        bool $resumeMode,
        bool $wasAwaiting
    ): ?array {
        $prechatUsername = null;
        try {
            $convUser = $this->conversation->user;
            if ($convUser && is_string($convUser->username ?? null) && trim($convUser->username) !== '') {
                $prechatUsername = trim($convUser->username);
            }
        } catch (\Throwable $_) {
            $prechatUsername = null;
        }

        $confirmedUsername = isset($sessionContext['confirmed_username']) && is_string($sessionContext['confirmed_username']) && trim($sessionContext['confirmed_username']) !== ''
            ? trim($sessionContext['confirmed_username'])
            : null;

        if ($confirmedUsername === null && $prechatUsername !== null) {
            $isValid = (new AIDepositWithdrawManager($this->conversation))->checkUsernameWithBigman($prechatUsername);
            if ($isValid === true) {
                $confirmedUsername = $prechatUsername;
                $sessionContext['confirmed_username'] = $prechatUsername;
                $sessionContext['confirmed_group_id'] = $this->conversation->group_id ?? null;
                try {
                    $sessionContext['username_confirmed_at'] = now()->toISOString();
                } catch (\Throwable $_) {
                    $sessionContext['username_confirmed_at'] = now();
                }

                if ($session) {
                    try {
                        $session->context = $sessionContext;
                        $session->save();
                    } catch (\Throwable $_) {
                        // best-effort only
                    }
                }
            }
        }

        $awaitingUsername = (bool) ($sessionContext['awaiting_username'] ?? false);
        $pendingUsername = isset($sessionContext['pending_username_candidate']) && is_string($sessionContext['pending_username_candidate']) && trim($sessionContext['pending_username_candidate']) !== ''
            ? trim($sessionContext['pending_username_candidate'])
            : null;

        $depositCheckContext = is_array($sessionContext['deposit_check'] ?? null) ? $sessionContext['deposit_check'] : ['stage' => 'idle'];
        $depositStageContext = is_string($depositCheckContext['stage'] ?? null) ? $depositCheckContext['stage'] : 'idle';
        $currentFlowType = $this->detectUserIdFlowType($rawText);
        $localSaysDepositNow = (new AIDepositWithdrawManager($this->conversation))->looksLikeDepositProblem($rawText) || $currentFlowType === 'deposit';
        $hasUserIdCandidateNow = is_string($this->extractUserId($rawText)) && trim((string) $this->extractUserId($rawText)) !== '';
        $isSimpleConfirmNow = $this->isAffirmativeReply($rawText) || $this->isNegativeReply($rawText);
        $explicitNonDepositFlow = in_array($currentFlowType, ['claim','withdraw','turnover','qris','password_reset'], true) || $coarseIntent === 'promo_claim';

        if (
            ($awaitingUsername || in_array($depositStageContext, ['awaiting_proof', 'awaiting_gateway_result'], true))
            && !$localSaysDepositNow
            && $explicitNonDepositFlow
            && !$hasUserIdCandidateNow
            && !$isSimpleConfirmNow
        ) {
            $sessionContext['awaiting_username'] = false;
            unset($sessionContext['pending_username_candidate']);
            $sessionContext['deposit_check'] = ['stage' => 'idle', 'last_status' => 'topic_switched'];
            if ($session) {
                try {
                    $session->context = $sessionContext;
                    $session->save();
                } catch (\Throwable $_) {
                    // best-effort only
                }
            }
            $awaitingUsername = false;
            $pendingUsername = null;
        }

        if ($session && !$resumeMode && !$wasAwaiting) {
            if ($awaitingUsername) {
                $lowerNorm = mb_strtolower($normalizedText);
                $isYes = $this->isAffirmativeReply($lowerNorm);
                $isNo = $this->isNegativeReply($lowerNorm);
                $depositCheck = is_array($sessionContext['deposit_check'] ?? null)
                    ? $sessionContext['deposit_check']
                    : null;
                $depositStage = is_string($depositCheck['stage'] ?? null)
                    ? $depositCheck['stage']
                    : 'idle';

                if ($pendingUsername && ($isYes || $isNo)) {
                    if ($isYes) {
                        $isValid = (new AIDepositWithdrawManager($this->conversation))->checkUsernameWithBigman($pendingUsername);
                        if ($isValid === false) {
                            unset($sessionContext['pending_username_candidate']);
                            $sessionContext['awaiting_username'] = true;
                            if ($session) {
                                try {
                                    $session->context = $sessionContext;
                                    $session->save();
                                } catch (\Throwable $_) {}
                            }

                            return [
                                'reply' => 'Bos, username "' . $pendingUsername . '" belum ketemu di sistem. Coba dicek lagi dan kirim USER ID yang benar ya (1 kata, tanpa spasi).',
                                'intent' => 'info',
                                'context' => [
                                    'awaitingUserId' => false,
                                    'processing' => false,
                                ],
                            ];
                        }

                        $sessionContext['confirmed_username'] = $pendingUsername;
                        $sessionContext['confirmed_group_id'] = $this->conversation->group_id ?? null;
                        try {
                            $sessionContext['username_confirmed_at'] = now()->toISOString();
                        } catch (\Throwable $_) {
                            $sessionContext['username_confirmed_at'] = now();
                        }
                        $sessionContext['awaiting_username'] = false;
                        unset($sessionContext['pending_username_candidate']);

                        if ($depositStage === 'awaiting_username') {
                            if (!is_array($depositCheck)) {
                                $depositCheck = [];
                            }
                            $depositCheck['stage'] = 'awaiting_proof';
                            $depositCheck['last_status'] = null;
                            $sessionContext['deposit_check'] = $depositCheck;
                        }

                        if ($session) {
                            try {
                                $session->context = $sessionContext;
                                $session->save();
                            } catch (\Throwable $_) {}
                        }

                        if ($depositStage === 'awaiting_username') {
                            $reply = 'Sip bosku, username kamu "' . $pendingUsername . '" sudah aku catat. ' . $tplAskProof;
                            return [
                                'reply' => $reply,
                                'intent' => 'deposit',
                                'context' => [
                                    'awaitingUserId' => false,
                                    'processing' => false,
                                    'confirmed_username' => $pendingUsername,
                                    'deposit_check' => [
                                        'stage' => 'awaiting_proof',
                                    ],
                                ],
                            ];
                        }

                        $reply = 'Sip bosku, username kamu "' . $pendingUsername . '" ya. Noted, kalau ada apa-apa sebut aja, aku bantu. 🙌';
                        return [
                            'reply' => $reply,
                            'intent' => 'info',
                            'context' => [
                                'awaitingUserId' => false,
                                'processing' => false,
                                'confirmed_username' => $pendingUsername,
                            ],
                        ];
                    }

                    unset($sessionContext['pending_username_candidate']);
                    $sessionContext['awaiting_username'] = true;
                    if ($session) {
                        try {
                            $session->context = $sessionContext;
                            $session->save();
                        } catch (\Throwable $_) {}
                    }

                    return [
                        'reply' => 'Oke bosku, kirim lagi username akun yang benar ya (1 kata, tanpa spasi).',
                        'intent' => 'info',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                        ],
                    ];
                }

                $maybeUser = $this->extractUserId($rawText);
                if (is_string($maybeUser) && trim($maybeUser) !== '') {
                    $candidate = trim($maybeUser);

                    $isValid = (new AIDepositWithdrawManager($this->conversation))->checkUsernameWithBigman($candidate);
                    if ($isValid === true) {
                        $sessionContext['confirmed_username'] = $candidate;
                        $sessionContext['confirmed_group_id'] = $this->conversation->group_id ?? null;
                        try {
                            $sessionContext['username_confirmed_at'] = now()->toISOString();
                        } catch (\Throwable $_) {
                            $sessionContext['username_confirmed_at'] = now();
                        }
                        $sessionContext['awaiting_username'] = false;
                        unset($sessionContext['pending_username_candidate']);

                        if ($depositStage === 'awaiting_username') {
                            if (!is_array($depositCheck)) {
                                $depositCheck = [];
                            }
                            $depositCheck['stage'] = 'awaiting_proof';
                            $depositCheck['last_status'] = null;
                            $sessionContext['deposit_check'] = $depositCheck;
                        }

                        if ($session) {
                            try {
                                $session->context = $sessionContext;
                                $session->save();
                            } catch (\Throwable $_) {}
                        }

                        if ($depositStage === 'awaiting_username') {
                            return [
                                'reply' => 'Sip bosku, username kamu "' . $candidate . '" sudah aku catat. ' . $tplAskProof,
                                'intent' => 'deposit',
                                'context' => [
                                    'awaitingUserId' => false,
                                    'processing' => false,
                                    'confirmed_username' => $candidate,
                                    'deposit_check' => [
                                        'stage' => 'awaiting_proof',
                                    ],
                                ],
                            ];
                        }

                        return [
                            'reply' => 'Sip bosku, username kamu "' . $candidate . '" sudah terdaftar dan aku catat ya. Kalau ada apa-apa sebut aja, aku bantu. 🙌',
                            'intent' => 'info',
                            'context' => [
                                'awaitingUserId' => false,
                                'processing' => false,
                                'confirmed_username' => $candidate,
                            ],
                        ];
                    }

                    if ($isValid === false) {
                        $sessionContext['awaiting_username'] = true;
                        unset($sessionContext['pending_username_candidate']);
                        if ($session) {
                            try {
                                $session->context = $sessionContext;
                                $session->save();
                            } catch (\Throwable $_) {}
                        }

                        return [
                            'reply' => 'Bos, username "' . $candidate . '"Belum ketemu. Coba kirim USER ID yang benar ya (1 kata, tanpa spasi).',
                            'intent' => 'info',
                            'context' => [
                                'awaitingUserId' => false,
                                'processing' => false,
                            ],
                        ];
                    }

                    $sessionContext['pending_username_candidate'] = $candidate;
                    $sessionContext['awaiting_username'] = true;
                    if ($session) {
                        try {
                            $session->context = $sessionContext;
                            $session->save();
                        } catch (\Throwable $_) {}
                    }

                    return [
                        'reply' => 'Username kamu "' . $candidate . '" ya bosku? Kalau benar jawab "iya", kalau salah bilang "bukan" dan kirim yang benar.',
                        'intent' => 'info',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                        ],
                    ];
                }

                return [
                    'reply' => 'Biar aku bisa bantu maksimal, kirim UserID akun kamu ya bos (1 kata, tanpa spasi).',
                    'intent' => 'info',
                    'context' => [
                        'awaitingUserId' => false,
                        'processing' => false,
                    ],
                ];
            }

            $forceAskUsername = true;
            if ($confirmedUsername === null || $forceAskUsername) {
                $_cancelLower = mb_strtolower($rawText);
                $_isCancelDeposit = (
                    preg_match('/\b(batal|batalkan|dibatalkan|batalin|dibatalin|cancel|ga jadi|gak jadi|nggak jadi|tidak jadi|tak jadi)\b/u', $_cancelLower) &&
                    preg_match('/\b(deposit|depo|deponya|dp)\b/u', $_cancelLower)
                );

                $localFlowTypeForDepositEntry = $this->detectUserIdFlowType($rawText);
                $_routerSaysDeposit = (
                    $routeHint === 'operational'
                    && $coarseIntent === 'deposit'
                    && $localFlowTypeForDepositEntry === 'deposit'
                );
                $_localSaysDeposit  = (new AIDepositWithdrawManager($this->conversation))->looksLikeDepositProblem($rawText);

                if (
                    ($_routerSaysDeposit || $_localSaysDeposit)
                    && !$_isCancelDeposit
                ) {
                    if (! (new AIDepositWithdrawManager($this->conversation))->looksLikeDepositProblem($rawText)) {
                        if (preg_match('/\b(minimal|min\b|berapa)\s+depo/i', $rawText)) {
                            $limits = Arr::get($aiSettings, 'depositLimits', []);
                            $min = isset($limits['min']) ? number_format($limits['min'], 0, ',', '.') : null;
                            $max = isset($limits['max']) ? number_format($limits['max'], 0, ',', '.') : null;
                            $parts = [];
                            if ($min !== null) {
                                $parts[] = 'minimal Rp ' . $min;
                            }
                            if ($max !== null) {
                                $parts[] = 'maksimal Rp ' . $max;
                            }
                            $reply = $parts ? 'Di situs ini ' . implode(' dan ', $parts) : 'Saya tidak punya informasi batas deposit.';

                            return [
                                'reply' => $reply,
                                'intent' => 'deposit',
                                'context' => [
                                    'awaitingUserId' => false,
                                    'processing' => false,
                                ],
                            ];
                        }
                    }

                    $depositCheck = is_array($sessionContext['deposit_check'] ?? null)
                        ? $sessionContext['deposit_check']
                        : [];
                    $currentStage = is_string($depositCheck['stage'] ?? null)
                        ? $depositCheck['stage']
                        : 'idle';
                    if ($currentStage === 'idle') {
                        $depositCheck['stage'] = 'awaiting_username';
                        $depositCheck['last_status'] = $depositCheck['last_status'] ?? null;
                        $sessionContext['deposit_check'] = $depositCheck;
                    }

                    $maybeUser = $this->extractUserId($rawText);
                    if (is_string($maybeUser) && trim($maybeUser) !== '') {
                        $candidate = trim($maybeUser);

                        $isValid = (new AIDepositWithdrawManager($this->conversation))->checkUsernameWithBigman($candidate);
                        if ($isValid === true) {
                            $sessionContext['confirmed_username'] = $candidate;
                            $sessionContext['confirmed_group_id'] = $this->conversation->group_id ?? null;
                            try {
                                $sessionContext['username_confirmed_at'] = now()->toISOString();
                            } catch (\Throwable $_) {
                                $sessionContext['username_confirmed_at'] = now();
                            }
                            $sessionContext['awaiting_username'] = false;
                            unset($sessionContext['pending_username_candidate']);
                            if ($session) {
                                try {
                                    $session->context = $sessionContext;
                                    $session->save();
                                } catch (\Throwable $_) {}
                            }

                            return [
                                'reply' => 'Sip bosku, username kamu "' . $candidate . '" sudah terdaftar dan aku catat ya. Kalau ada apa-apa sebut aja, aku bantu. 🙌',
                                'intent' => 'info',
                                'context' => [
                                    'awaitingUserId' => false,
                                    'processing' => false,
                                    'confirmed_username' => $candidate,
                                ],
                            ];
                        }

                        if ($isValid === false) {
                            $sessionContext['awaiting_username'] = true;
                            unset($sessionContext['pending_username_candidate']);
                            if ($session) {
                                try {
                                    $session->context = $sessionContext;
                                    $session->save();
                                } catch (\Throwable $_) {}
                            }

                            return [
                                'reply' => 'Bos, username "' . $candidate . '" Belum ketemu. Coba kirim USER ID yang benar ya (1 kata, tanpa spasi).',
                                'intent' => 'info',
                                'context' => [
                                    'awaitingUserId' => false,
                                    'processing' => false,
                                ],
                            ];
                        }

                        $sessionContext['awaiting_username'] = true;
                        $sessionContext['pending_username_candidate'] = $candidate;
                        if ($session) {
                            try {
                                $session->context = $sessionContext;
                                $session->save();
                            } catch (\Throwable $_) {}
                        }

                        return [
                            'reply' => 'Bos, biar gak salah, ini username kamu: "' . $candidate . '" ya? Kalau benar jawab "iya", kalau salah kirim yang benar.',
                            'intent' => 'info',
                            'context' => [
                                'awaitingUserId' => false,
                                'processing' => false,
                            ],
                        ];
                    }

                    $sessionContext['awaiting_username'] = true;
                    if ($session) {
                        try {
                            $session->context = $sessionContext;
                            $session->save();
                        } catch (\Throwable $_) {}
                    }

                    return [
                        'reply' => $tplAskUsername,
                        'intent' => 'info',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                        ],
                    ];
                }
            }
        }

        return null;
    }

    public function replyAsksForUserId(?string $text): bool
    {
        if (!$text) return false;
        return (bool) preg_match('/\buser\s*id\b|\buserid\b|\bcid\b|\buid\b/i', mb_strtolower($text));
    }

    public function requiresUserIdFlow(string $flowType, string $text): bool
    {
        $flowType = is_string($flowType) ? trim(mb_strtolower($flowType)) : '';

        if ($flowType === 'deposit') {
            $lower = mb_strtolower($text);
            $cancelWords = '(batal|batalkan|dibatalkan|batalin|dibatalin|cancel|ga jadi|gak jadi|nggak jadi|tidak jadi|tak jadi)';
            $depositWords = '(deposit|depo|deponya|dp)';
            if (preg_match("/\b{$cancelWords}\b/u", $lower) && preg_match("/\b{$depositWords}\b/u", $lower)) {
                return false;
            }
        }

        if (in_array($flowType, ['claim','withdraw','deposit','qris','password_reset'], true)) {
            return true;
        }

        if ($flowType === 'turnover') {
            return $this->looksAccountSpecificTurnover($text);
        }

        return false;
    }

    public function looksAccountSpecificTurnover(string $text): bool
    {
        $lower = mb_strtolower($text);
        $hasTurnoverMarker = (bool) preg_match('/\b(turnover|rollover|wr|wager|to)\b/u', $lower);
        if (!$hasTurnoverMarker) return false;
        $hasPronounOrAccount = (bool) preg_match('/\b(saya|aku|gue|gua|gw|akun|user\s*id|userid|uid|cid|id|my|akun\s*saya|akun\s*aku)\b/u', $lower);
        $hasCheckProgressCue = (bool) preg_match('/\b(cek|check|progress|progres|sisa|status|udah|sudah|tinggal)\b/u', $lower);
        return $hasPronounOrAccount || $hasCheckProgressCue;
    }

    // Helper methods

    private function tokenizeWords(string $text): array
    {
        $text = mb_strtolower($text);
        $words = preg_split('/\s+/', $text) ?: [];
        return array_values(array_filter(array_map(fn($w) => trim((string) $w), $words), fn($w) => $w !== ''));
    }

    private function containsApprox(array $tokens, array $targets, int $maxDistance): bool
    {
        foreach ($tokens as $token) {
            foreach ($targets as $target) {
                if ($this->levenshteinDistance($token, $target) <= $maxDistance) {
                    return true;
                }
            }
        }
        return false;
    }

    private function levenshteinDistance(string $s1, string $s2): int
    {
        $len1 = mb_strlen($s1);
        $len2 = mb_strlen($s2);
        $d = array_fill(0, $len1 + 1, array_fill(0, $len2 + 1, 0));

        for ($i = 0; $i <= $len1; $i++) $d[$i][0] = $i;
        for ($j = 0; $j <= $len2; $j++) $d[0][$j] = $j;

        for ($i = 1; $i <= $len1; $i++) {
            for ($j = 1; $j <= $len2; $j++) {
                $cost = (mb_substr($s1, $i - 1, 1) === mb_substr($s2, $j - 1, 1)) ? 0 : 1;
                $d[$i][$j] = min(
                    $d[$i - 1][$j] + 1,
                    $d[$i][$j - 1] + 1,
                    $d[$i - 1][$j - 1] + $cost
                );
            }
        }

        return $d[$len1][$len2];
    }
}
