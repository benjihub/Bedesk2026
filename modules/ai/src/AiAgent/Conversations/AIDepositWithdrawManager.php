<?php

namespace Ai\AiAgent\Conversations;

use Ai\AiAgent\Models\AiAgentSession;
use Ai\AiAgent\Models\UserConversationMemory;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Team\Models\GroupAiAgentSettings;
use App\Team\Models\GroupSettings;
use GuzzleHttp\Client;
use Illuminate\Support\Arr;

/**
 * Manages deposit/withdraw support flows, including:
 * - Bank proof name confirmation (awaiting_bank_proof_account_name state)
 * - Diff-name BigMan retry logic (awaiting_bigman_diff_name state)
 * - Deposit-check state machine (awaiting_username, awaiting_proof, awaiting_gateway_result, done, cancelled, escalated states)
 * - Explicit deposit cancellation
 * - Heuristic deposit problem detection
 * - Query-based limit responses
 */
class AIDepositWithdrawManager
{
    private Conversation $conversation;
    private AIUserIdFlowManager $userIdFlowManager;
    private AIClassifierManager $classifierManager;

    public function __construct(
        Conversation $conversation,
        ?AIUserIdFlowManager $userIdFlowManager = null,
        ?AIClassifierManager $classifierManager = null,
    ) {
        $this->conversation = $conversation;
        $this->userIdFlowManager = $userIdFlowManager ?? new AIUserIdFlowManager($conversation);
        $this->classifierManager = $classifierManager ?? new AIClassifierManager();
    }

    /**
     * Detect if text mentions a deposit problem (not just limits inquiry).
     */
    public function looksLikeDepositProblem(string $text): bool
    {
        $t = mb_strtolower($text);
        $hasDepositWord = (bool) preg_match('/\b(deposit|depo|deponya|top\s?up|topup|isi\s*saldo)\b/u', $t);
        if (!$hasDepositWord) {
            return false;
        }

        // Problem cues: "gak masuk", "belum masuk", "pending", "lama",
        // "hilang", "error", "salah kirim", etc.
        $problemCues = [
            'ga masuk', 'gak masuk', 'gk masuk', 'tdk masuk', 'tidak masuk',
            'belum masuk', 'blm masuk', 'pending', 'lama', 'lambat', 'lemot',
            'hilang', 'hangus', 'error', 'gagal', 'bug', 'salah deposit',
            'salah depo', 'salah kirim', 'batalin', 'batalkan', 'refund',
        ];
        foreach ($problemCues as $cue) {
            if (str_contains($t, $cue)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find the latest user message in this conversation that has a
     * bank_proof payload, and return [bankProofArray, messageId].
     */
    public function getLatestBankProofForConversation(): array
    {
        try {
            // IMPORTANT: do not just read the latest user message, because
            // users often send follow-up text after uploading proof. In that
            // case the newest message has no bank_proof and we would
            // incorrectly think proof is missing.
            $messages = ConversationItem::query()
                ->where('conversation_id', $this->conversation->id)
                ->where('type', 'message')
                ->where('author', Conversation::AUTHOR_USER)
                ->orderByDesc('id')
                ->limit(30)
                ->get();

            if ($messages->isEmpty()) {
                return [null, null];
            }

            foreach ($messages as $message) {
                $data = is_array($message->data ?? null) ? $message->data : [];
                $bankProof = is_array($data['bank_proof'] ?? null) ? $data['bank_proof'] : null;

                if ($bankProof) {
                    return [$bankProof, $message->id];
                }
            }

            return [null, null];
        } catch (\Throwable $_) {
            return [null, null];
        }
    }

    /**
     * Mark the result of the most recent deposit_check flow on the
     * username+group CRM memory, without storing any sensitive fields.
     */
    public function markDepositCheckResultOnUserMemory(string $status): void
    {
        try {
            $session = $this->conversation->aiAgentSession()->first();
            $ctx = is_array($session?->context ?? null) ? $session->context : [];
            $username = isset($ctx['confirmed_username']) && is_string($ctx['confirmed_username']) && trim($ctx['confirmed_username']) !== ''
                ? trim($ctx['confirmed_username'])
                : null;
            $groupId = $ctx['confirmed_group_id'] ?? $this->conversation->group_id ?? null;

            if (!$username || !$groupId) {
                return;
            }

            $memory = UserConversationMemory::firstOrCreate([
                'username' => $username,
                'group_id' => (int) $groupId,
            ]);

            $notes = is_array($memory->notes ?? null) ? $memory->notes : [];
            $notes['last_deposit_check'] = [
                'status' => $status,
                'updated_at' => now()->toISOString(),
            ];
            $memory->notes = $notes;
            $memory->save();
        } catch (\Throwable $_) {
            // best-effort only
        }
    }

    /**
     * Call BigMan username check API for the current conversation's group.
     * Returns true if username exists, false if not, and null on error.
     */
    public function checkUsernameWithBigman(string $username): ?bool
    {
        $username = trim($username);
        if ($username === '') {
            return null;
        }

        $groupId = $this->conversation->group_id;
        $endpoint = 'https://bigman.app/api/username/check';
        $token = null;

        try {
            if ($groupId) {
                $record = GroupAiAgentSettings::query()
                    ->where('group_id', $groupId)
                    ->first();
                $overrides = $record?->overrides ?? [];
                if (!is_array($overrides)) {
                    $overrides = [];
                }
                $bigman = $overrides['bigman'] ?? [];
                if (is_array($bigman)) {
                    // Prefer dedicated usernameToken if set, otherwise
                    // fall back to the general BigMan token.
                    if (isset($bigman['usernameToken']) && is_string($bigman['usernameToken']) && trim($bigman['usernameToken']) !== '') {
                        $token = trim($bigman['usernameToken']);
                    } elseif (isset($bigman['token']) && is_string($bigman['token']) && trim($bigman['token']) !== '') {
                        $token = trim($bigman['token']);
                    }

                    $endpoint = $bigman['usernameEndpoint'] ?? $endpoint;
                }
            }
        } catch (\Throwable $_) {
            // ignore config errors, fall back to defaults
        }

        if (!is_string($endpoint) || trim($endpoint) === '') {
            return null;
        }

        try {
            $client = new Client(['timeout' => 8]);
            $headers = [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ];
            if (is_string($token) && trim($token) !== '') {
                $headers['Authorization'] = 'Bearer ' . trim($token);
            }

            $response = $client->post($endpoint, [
                'headers' => $headers,
                'json' => ['username' => $username],
            ]);

            $status = $response->getStatusCode();
            $raw = (string) $response->getBody();
            $data = null;
            try {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            } catch (\Throwable $_) {
                $data = null;
            }

            if ($status === 200 && is_array($data) && array_key_exists('success', $data)) {
                return (bool) $data['success'];
            }

            return null;
        } catch (\Throwable $_) {
            return null;
        }
    }

    /**
     * Orchestrate the deposit/withdraw limits quick-path response.
     * Returns reply array if limits match, null otherwise.
     */
    public function tryHandleDepositWithdrawLimitsQuery(string $normalizedText, array $aiSettings): ?array
    {
        try {
            $t = mb_strtolower($normalizedText);
            $asksDeposit = (bool) preg_match('/\b(deposit|depo|deponya|top\s?up|topup|isi\s*saldo)\b/u', $t);
            $asksWithdraw = (bool) preg_match('/\b(withdraw|wd|tarik|penarikan|withdrawal)\b/u', $t);
            // Safer limit detection: avoid treating casual address "min" as "minimum".
            $mentionsLimitWords = (bool) preg_match('/\b(minimal|minimum|max|maksimal|maximum|limit|batas)\b/u', $t);
            $mentionsBareMin = (bool) preg_match('/\bmin\b/u', $t);
            $asksHowMuch = (bool) preg_match('/\b(berapa)\b/u', $t);
            // Consider "min" a limit cue only when it is closely tied to deposit/withdraw terms.
            $minNearDepWd = (bool) preg_match('/\b(min\s*(depo|deponya|deposit|wd|withdraw|penarikan|tarik)|(depo|deponya|deposit|wd|withdraw|penarikan|tarik)\s*min)\b/u', $t);
            // Detect "min" used as an address (admin) — usually appears at sentence start or end.
            $addressingMin = (bool) preg_match('/(^|[\s,.;:!?])min[\s,.;:!?]*$/u', $t) || (bool) preg_match('/^(min)[\s,.;:!?]/u', $t);
            $mentionsLimit = $mentionsLimitWords || ($mentionsBareMin && ($minNearDepWd || $asksHowMuch) && !$addressingMin);

            if ($mentionsLimit && ($asksDeposit || $asksWithdraw)) {
                $lines = [];
                $dep = $aiSettings['depositLimits'] ?? null;
                $wd = $aiSettings['withdrawLimits'] ?? null;
                if (is_array($dep)) {
                    $min = $dep['min'] ?? null; $max = $dep['max'] ?? null;
                    if ($asksDeposit || (!$asksWithdraw && ($min !== null || $max !== null))) {
                        if ($min !== null) $lines[] = 'Minimal deposit: ' . (string) $min;
                        if ($max !== null) $lines[] = 'Maksimal deposit: ' . (string) $max;
                    }
                }
                if (is_array($wd)) {
                    $min = $wd['min'] ?? null; $max = $wd['max'] ?? null;
                    if ($asksWithdraw || (!$asksDeposit && ($min !== null || $max !== null))) {
                        if ($min !== null) $lines[] = 'Minimal withdraw: ' . (string) $min;
                        if ($max !== null) $lines[] = 'Maksimal withdraw: ' . (string) $max;
                    }
                }

                if (!empty($lines)) {
                    $ctxLimits = [
                        'deposit' => is_array($dep) ? ['min' => $dep['min'] ?? null, 'max' => $dep['max'] ?? null] : null,
                        'withdraw' => is_array($wd) ? ['min' => $wd['min'] ?? null, 'max' => $wd['max'] ?? null] : null,
                    ];
                    return [
                        'reply' => implode("\n", $lines),
                        'intent' => $asksDeposit && !$asksWithdraw ? 'deposit' : ($asksWithdraw && !$asksDeposit ? 'withdraw' : 'promotion'),
                        'context' => ['limits' => $ctxLimits],
                    ];
                }
            }
        } catch (\Throwable $_) {
            // ignore
        }

        return null;
    }

    /**
     * Orchestrate the deposit-check state machine. This is called from buildReply()
     * and handles all deposit problem detection, username collection gating, proof
     * validation, and BigMan gateway result handling.
     *
     * Returns a reply array if the flow is handled (early exit), or null to continue
     * normal LLM processing.
     *
     * @param string $rawText The user's raw message
     * @param array $aiSettings Group AI settings including templates and limits
     * @param ?string $confirmedUsername User's confirmed account ID (if known)
     * @param ?string $lastUserIdFlowType Previous active flow type (deposit/withdraw/etc.)
     * @param bool $awaitingUsername Whether we're currently awaiting username input
     * @param array &$sessionContext Session context array (mutated by reference)
     * @param ?object $sessionForDeposit AiAgentSession model to persist mutations
     * @param array $depositFlowTemplates Configured templates (askUsername, askProof, etc.)
     * @return ?array Reply array if flow handled, null otherwise
     */
    public function handleDepositCheckStateMachine(
        string $rawText,
        array $aiSettings,
        ?string $confirmedUsername,
        ?string $lastUserIdFlowType,
        bool $awaitingUsername,
        array &$sessionContext,
        ?object $sessionForDeposit = null,
        array $depositFlowTemplates = []
    ): ?array
    {
        try {
            if (!$sessionForDeposit) {
                if (method_exists($this->conversation, 'aiAgentSession')) {
                    $sessionForDeposit = $this->conversation->aiAgentSession()->first();
                } else {
                    $sessionForDeposit = AiAgentSession::query()
                        ->where('conversation_id', $this->conversation->id)
                        ->first();
                }
            }

            $depositCheck = is_array($sessionContext['deposit_check'] ?? null)
                ? $sessionContext['deposit_check']
                : ['stage' => 'idle'];
            $stage = is_string($depositCheck['stage'] ?? null) ? $depositCheck['stage'] : 'idle';

            // Helper closure: persist deposit_check mutations back to session.
            $saveDepositCheck = function (array $state) use (&$sessionContext, $sessionForDeposit) {
                $sessionContext['deposit_check'] = $state;
                if ($sessionForDeposit) {
                    try {
                        $sessionForDeposit->context = $sessionContext;
                        $sessionForDeposit->save();
                    } catch (\Throwable $_) {
                        // best-effort only
                    }
                }
            };

            // Detect if user wants to cancel active deposit.
            $lowerRaw = mb_strtolower($rawText);
            $hasCancelWord = (bool) preg_match('/\b(batal|batalkan|dibatalkan|batalin|dibatalin|cancel|ga jadi|gak jadi|nggak jadi|tidak jadi|tak jadi)\b/u', $lowerRaw);
            $hasDepositWord = (bool) preg_match('/\b(deposit|depo|deponya|dp)\b/u', $lowerRaw);
            // During active deposit flow, short follow-ups like "di batalin" are understood.
            $wantsCancelDeposit = $hasCancelWord && (
                $hasDepositWord ||
                $stage !== 'idle' ||
                $lastUserIdFlowType === 'deposit' ||
                $awaitingUsername
            );

            // Handle explicit deposit cancellation in active flow.
            if ($stage !== 'idle' && $wantsCancelDeposit) {
                $depositCheck['stage'] = 'cancelled';
                $depositCheck['last_status'] = 'cancelled';
                $saveDepositCheck($depositCheck);

                try {
                    $this->markDepositCheckResultOnUserMemory('cancelled');
                } catch (\Throwable $_) { /* best-effort only */ }

                $waitMessage = $this->resolveWaitMessage($aiSettings, $confirmedUsername);

                return [
                    'reply' => $waitMessage,
                    'intent' => 'processing',
                    'context' => [
                        'awaitingUserId' => false,
                        'processing' => true,
                        'deposit_check' => [
                            'stage' => $depositCheck['stage'],
                            'status' => 'cancelled',
                        ],
                    ],
                ];
            }

            // Handle cancellation when idle (proactive cancellation before flow started).
            if ($stage === 'idle' && $wantsCancelDeposit) {
                $depositCheck['stage'] = 'cancelled';
                $depositCheck['last_status'] = 'cancelled';
                $saveDepositCheck($depositCheck);

                $waitMessage = $this->resolveWaitMessage($aiSettings, $confirmedUsername);

                return [
                    'reply' => $waitMessage,
                    'intent' => 'processing',
                    'context' => [
                        'awaitingUserId' => false,
                        'processing' => true,
                        'deposit_check' => [
                            'stage' => $depositCheck['stage'],
                            'status' => 'cancelled',
                        ],
                    ],
                ];
            }

            // Handle active proof/gateway states.
            if (in_array($stage, ['awaiting_proof', 'awaiting_gateway_result'], true)) {
                [$bankProof, $proofMessageId] = $this->getLatestBankProofForConversation();

                // Extract template defaults.
                $tplProofMissing = $depositFlowTemplates['proofMissing'] 
                    ?? 'Aku belum lihat bukti transfernya nih bos. Kirim screenshot struk/bukti deposit yang jelas (nominal dan rekening terlihat), nanti aku bantu cek otomatis ya. 🙏';
                $tplChecking = $depositFlowTemplates['checking']
                    ?? 'Bukti deposit kamu lagi dicek ke sistem ya bos, mohon tunggu sebentar. Nanti kalau sudah ada hasil aku kabari. 🙏';
                $tplDoneResolved = $depositFlowTemplates['doneResolved']
                    ?? 'Oke bosku, bukti deposit kamu sudah terdeteksi dan cocok di sistem. Biasanya sebentar lagi saldo akan masuk, kalau masih belum juga kabari aku lagi ya. 🙏';
                $tplDoneUnresolved = $depositFlowTemplates['doneUnresolved']
                    ?? 'Dari hasil cek otomatis, bukti deposit ini belum ketemu jelas di sistem. Aku teruskan ke tim CS supaya dicek manual ya, mohon tunggu sebentar dan jangan kirim deposit baru dulu. 🙏';

                if (!$bankProof) {
                    // No proof yet: remind user.
                    $depositCheck['stage'] = 'awaiting_proof';
                    $saveDepositCheck($depositCheck);

                    return [
                        'reply' => $tplProofMissing,
                        'intent' => 'deposit',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                        ],
                    ];
                }

                $bigman = is_array($bankProof['bigman'] ?? null) ? $bankProof['bigman'] : [];
                $accepted = $bigman['accepted'] ?? null;
                $bigmanAttempts = isset($bigman['attempts']) && is_numeric($bigman['attempts'])
                    ? (int) $bigman['attempts']
                    : 0;

                if (is_bool($accepted)) {
                    // Final status from gateway.
                    $status = $accepted ? 'resolved' : 'unresolved';
                    $depositCheck['stage'] = 'done';
                    $depositCheck['last_status'] = $status;
                    $depositCheck['last_proof_message_id'] = $proofMessageId;
                    $saveDepositCheck($depositCheck);

                    try {
                        $this->markDepositCheckResultOnUserMemory($status);
                    } catch (\Throwable $_) {}

                    if ($accepted) {
                        $reply = $tplDoneResolved;
                    } else {
                        // Escalate if too many failed attempts.
                        if ($bigmanAttempts > 3) {
                            return [
                                'reply' => 'Bos, sudah aku eskalasi ke tim support manusia untuk pengecekan manual ya. Mereka akan bantu lanjutkan verifikasi tiket kamu.',
                                'intent' => 'processing',
                                'context' => [
                                    'awaitingUserId' => false,
                                    'processing' => true,
                                    'deposit_check' => [
                                        'stage' => 'escalated_to_human',
                                        'status' => 'unresolved_escalated',
                                        'attempts' => $bigmanAttempts,
                                    ],
                                ],
                            ];
                        }

                        $reply = $tplDoneUnresolved;
                    }

                    return [
                        'reply' => $reply,
                        'intent' => 'deposit',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                            'deposit_check' => [
                                'stage' => $depositCheck['stage'],
                                'status' => $status,
                            ],
                        ],
                    ];
                }

                // Pending gateway check.
                if (!empty($bigman)) {
                    $depositCheck['stage'] = 'awaiting_gateway_result';
                    $depositCheck['last_proof_message_id'] = $proofMessageId;
                    $saveDepositCheck($depositCheck);

                    return [
                        'reply' => $tplChecking,
                        'intent' => 'deposit',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                            'deposit_check' => [
                                'stage' => $depositCheck['stage'],
                            ],
                        ],
                    ];
                }

                // Fallback: proof exists but no clear gateway info.
                $depositCheck['stage'] = 'done';
                $depositCheck['last_status'] = 'unknown';
                $depositCheck['last_proof_message_id'] = $proofMessageId;
                $saveDepositCheck($depositCheck);

                return [
                    'reply' => 'Bukti deposit sudah aku terima ya bos. Lagi aku cek dulu, mohon ditunggu sebentar. 🙏',
                    'intent' => 'deposit',
                    'context' => [
                        'awaitingUserId' => false,
                        'processing' => false,
                        'deposit_check' => [
                            'stage' => $depositCheck['stage'],
                            'status' => 'unknown',
                        ],
                    ],
                ];
            }

            // Flow continues (null exit) — no early return needed.
        } catch (\Throwable $_) {
            // best-effort only; do not block normal flow
        }

        return null;
    }

    /**
     * Resolve the wait/processing message based on group settings and username.
     * Delegates to AIUserIdFlowManager.
     */
    private function resolveWaitMessage(array $aiSettings, ?string $username): string
    {
        return $this->userIdFlowManager->resolveWaitMessage($aiSettings, $username);
    }

    /**
     * Handle awaiting_bank_proof_account_name flow: ask for missing account name,
     * persist it into the stored bank_proof message, resend to BigMan, and
     * return an immediate reply array or null to continue.
     */
    public function handleAwaitingBankProofAccountName(string $rawText, array &$sessionContext, ?object $session = null): ?array
    {
        $awaitingBankProofName = isset($sessionContext['awaiting_bank_proof_account_name']) && $sessionContext['awaiting_bank_proof_account_name'];
        if (!$awaitingBankProofName) return null;

        $candidate = trim($rawText);
        $isAck = (bool) preg_match('/\b(ok|oke|sip|siap|ya|iya|yes|terima\s+kasih|thanks)\b/i', $candidate);
        $words = preg_split('/\s+/', $candidate, -1, PREG_SPLIT_NO_EMPTY);
        $looksLikeName = !$isAck && is_array($words) && count($words) >= 2 && mb_strlen($candidate) > 3;

        if (!$looksLikeName) {
            return [
                'reply' => 'Bos, tolong kirim nama rekening pengirim nya',
                'intent' => 'info',
                'context' => [
                    'awaitingUserId' => false,
                    'processing' => false,
                    'awaiting_bank_proof_account_name' => true,
                ],
            ];
        }

        $bpMessageId = $sessionContext['bank_proof_message_id'] ?? null;
        if (is_numeric($bpMessageId)) {
            try {
                $bpMessage = ConversationItem::find((int) $bpMessageId);
                if ($bpMessage) {
                    $data = is_array($bpMessage->data ?? null) ? $bpMessage->data : [];
                    $bankProof = is_array($data['bank_proof'] ?? null) ? $data['bank_proof'] : [];
                    $bankProof['from_account_name'] = $candidate;
                    $bankProof['_suppress_bigman_auto_reply'] = true;
                    $data['bank_proof'] = $bankProof;
                    $bpMessage->data = $data;
                    $bpMessage->save();

                    // Clear the waiting flag and persist session
                    $sessionContext['awaiting_bank_proof_account_name'] = false;
                    unset($sessionContext['bank_proof_message_id']);
                    if ($session) {
                        $session->context = $sessionContext;
                        $session->save();
                    }

                    try {
                        (new \App\Conversations\Jobs\SendBankProofToBigman(
                            $this->conversation->id,
                            $bpMessage->id,
                            $bankProof,
                        ))->handle();
                    } catch (\Throwable $_) {
                        // ignore; the job will log errors
                    }

                    $bpMessage->refresh();
                    $postData = is_array($bpMessage->data ?? null) ? $bpMessage->data : [];
                    $postBankProof = is_array($postData['bank_proof'] ?? null) ? $postData['bank_proof'] : [];
                    $postBigman = is_array($postBankProof['bigman'] ?? null) ? $postBankProof['bigman'] : [];
                    $postAccepted = $postBigman['accepted'] ?? null;
                    $postTicketNotFound = (bool) ($postBigman['ticket_not_found'] ?? false);

                    if ($postTicketNotFound && $postAccepted !== true) {
                        return [
                            'reply' => 'Bos, nama akun terdaftar berbeda dengan nama di bukti transfer? Kalau iya jawab "ya", kalau tidak jawab "tidak".',
                            'intent' => 'info',
                            'context' => [
                                'awaitingUserId' => false,
                                'processing' => false,
                                'awaiting_bigman_diff_name' => true,
                            ],
                        ];
                    }

                    return [
                        'reply' => 'Sip bos, nama rekeningnya sudah aku catat. Aku kirim ulang bukti ke sistem untuk dicek lagi ya.',
                        'intent' => 'info',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                        ],
                    ];
                }
            } catch (\Throwable $_) {
                // ignore
            }
        }

        // If we couldn't locate the proof message, just clear and continue.
        $sessionContext['awaiting_bank_proof_account_name'] = false;
        unset($sessionContext['bank_proof_message_id']);
        if ($session) {
            $session->context = $sessionContext;
            $session->save();
        }

        return null;
    }

    /**
     * Handle awaiting_bigman_diff_name flow: classify reply, optionally
     * resend proof with is_diff_name and return reply array or null.
     */
    public function handleAwaitingBigmanDiffName(string $rawText, array &$sessionContext, ?object $session = null): ?array
    {
        $awaitingDiffName = isset($sessionContext['awaiting_bigman_diff_name']) && $sessionContext['awaiting_bigman_diff_name'];
        if (!$awaitingDiffName) return null;

        $candidate = trim($rawText);
        $decision = $this->userIdFlowManager->classifyDiffNameReply($candidate);
        if ($decision === null) {
            $aiSettings = (new AIGroupSettingsResolver())->resolve($this->conversation->group_id);
            $agentName = trim((string) Arr::get($aiSettings, 'name', 'AI assistant'));
            $agentName = $agentName !== '' ? $agentName : 'AI assistant';
            $decision = $this->classifierManager->classifyDiffNameReplyWithLlm($candidate, [
                'conversation_id' => $this->conversation->id,
                'group_id' => $this->conversation->group_id ? (int) $this->conversation->group_id : null,
                'agent_name' => $agentName,
            ]);
        }
        $isYes = ($decision === true);
        $isNo = ($decision === false);

        if (!$isYes && !$isNo) {
            $retries = isset($sessionContext['awaiting_bigman_diff_name_retries']) && is_numeric($sessionContext['awaiting_bigman_diff_name_retries'])
                ? (int) $sessionContext['awaiting_bigman_diff_name_retries']
                : 0;
            $sessionContext['awaiting_bigman_diff_name_retries'] = $retries + 1;
            if ($session) {
                $session->context = $sessionContext;
                $session->save();
            }

            return [
                'reply' => 'Apakah nama akun terdaftar berbeda dengan nama di bukti transfer? Bisa jawab "beda" atau "sama" (boleh juga "ya" / "tidak").',
                'intent' => 'info',
                'context' => [
                    'awaitingUserId' => false,
                    'processing' => false,
                    'awaiting_bigman_diff_name' => true,
                ],
            ];
        }

        // Clear waiting flags
        $sessionContext['awaiting_bigman_diff_name'] = false;
        $bpMessageId = $sessionContext['bigman_diff_proof_message_id'] ?? null;
        unset($sessionContext['bigman_diff_proof_message_id']);
        unset($sessionContext['awaiting_bigman_diff_name_retries']);
        if ($session) {
            $session->context = $sessionContext;
            $session->save();
        }

        if ($isYes && is_numeric($bpMessageId)) {
            try {
                $bpMessage = ConversationItem::find((int) $bpMessageId);
                if ($bpMessage) {
                    $data = is_array($bpMessage->data ?? null) ? $bpMessage->data : [];
                    $bankProof = is_array($data['bank_proof'] ?? null) ? $data['bank_proof'] : [];
                    $bankProof['is_diff_name'] = true;
                    $bankProof['_suppress_bigman_auto_reply'] = true;
                    $data['bank_proof'] = $bankProof;
                    $bpMessage->data = $data;
                    $bpMessage->save();

                    try {
                        (new \App\Conversations\Jobs\SendBankProofToBigman(
                            $this->conversation->id,
                            $bpMessage->id,
                            $bankProof,
                        ))->handle();
                    } catch (\Throwable $_) {
                        // ignore; the job will log errors
                    }

                    $bpMessage->refresh();
                    $postData = is_array($bpMessage->data ?? null) ? $bpMessage->data : [];
                    $postBankProof = is_array($postData['bank_proof'] ?? null) ? $postData['bank_proof'] : [];
                    $postBigman = is_array($postBankProof['bigman'] ?? null) ? $postBankProof['bigman'] : [];
                    $postAccepted = $postBigman['accepted'] ?? null;
                    $postTicketNotFound = (bool) ($postBigman['ticket_not_found'] ?? false);

                    if ($postTicketNotFound && $postAccepted !== true) {
                        return [
                            'reply' => 'Bos, sudah dicek ulang termasuk skenario nama berbeda, tapi tiket tetap tidak ditemukan di sistem. Berarti tiketnya memang tidak ada.',
                            'intent' => 'info',
                            'context' => [
                                'awaitingUserId' => false,
                                'processing' => false,
                            ],
                        ];
                    }

                    return [
                        'reply' => 'Oke bos, aku kirim ulang bukti ke sistem dengan flag nama berbeda. Tunggu sebentar ya.',
                        'intent' => 'info',
                        'context' => [
                            'awaitingUserId' => false,
                            'processing' => false,
                        ],
                    ];
                }
            } catch (\Throwable $_) {
                // ignore
            }
        }

        return [
            'reply' => 'Oke bos, kalau masih belum ketemu berarti tiket memang tidak ada. Coba hubungi CS kalau butuh bantuan lebih lanjut.',
            'intent' => 'info',
            'context' => [
                'awaitingUserId' => false,
                'processing' => false,
            ],
        ];
    }
}
