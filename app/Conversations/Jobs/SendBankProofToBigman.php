<?php

namespace App\Conversations\Jobs;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Team\Models\GroupAiAgentSettings;
use GuzzleHttp\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendBankProofToBigman implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $conversationId,
        public int $messageId,
        public array $bankProof,
    ) {
        // run on a dedicated queue so it never blocks AI replies
        $this->onQueue('bigman');
    }

    public function handle(): void
    {
        $conversation = Conversation::find($this->conversationId);
        if (!$conversation || !$conversation->user) {
            return;
        }

        // for BigMan we prefer the name the visitor provided on the pre-chat
        // form; this gets written to the user's `name` column via
        // StoreChatFormData. fall back to the actual login username if absent.
        $username = $conversation->user->name ?: $conversation->user->username;
        if (!$username) {
            return;
        }

        $best = $this->bankProof;
        $suppressAutoReply = (bool) ($best['_suppress_bigman_auto_reply'] ?? false);
        $amountInt = (int) round((float) ($best['amount'] ?? 0));
        if ($amountInt < 10000) {
            return;
        }

        // Determine transaction type from flow name (deposit vs withdraw).
        // If it can't be inferred from the flow, default to 'deposit' so
        // we NEVER skip the BigMan API call.
        $transactionType = null;
        try {
            $session = $conversation->aiAgentSession()->first();
            $flowId = is_array($session->context ?? null)
                ? ($session->context['flow_id'] ?? null)
                : null;
            if ($flowId) {
                $flow = \Ai\AiAgent\Models\AiAgentFlow::find($flowId);
                if ($flow) {
                    $flowName = strtolower((string)($flow->name ?? ''));
                    if (Str::contains($flowName, ['withdraw', 'wd', 'withdrawal'])) {
                        $transactionType = 'withdraw';
                    } elseif (Str::contains($flowName, ['deposit', 'depo', 'top up', 'topup'])) {
                        $transactionType = 'deposit';
                    }
                }
            }
        } catch (\Throwable $_) {
            $transactionType = null;
        }

        if (!$transactionType) {
            $transactionType = 'deposit';
        }

        // TEMP: only support deposit checks for now. If the flow
        // looks like a withdraw, skip calling BigMan entirely.
        if ($transactionType !== 'deposit') {
            \Log::info('BankProof: skipping BigMan withdraw check (disabled)', [
                'conversation_id' => $conversation->id,
                'message_id' => $this->messageId,
                'transaction_type' => $transactionType,
            ]);
            return;
        }

        // Resolve per-group BigMan configuration (token + custom endpoints)
        $bigmanConfig = [
            'token' => null,
            'depositEndpoint' => 'https://bigman.app/api/deposit-ticket/check',
            'withdrawEndpoint' => 'https://bigman.app/api/withdraw-ticket/check',
        ];

        try {
            if ($conversation->group_id) {
                $record = GroupAiAgentSettings::query()
                    ->where('group_id', $conversation->group_id)
                    ->first();
                $overrides = $record?->overrides ?? [];
                if (!is_array($overrides)) {
                    $overrides = [];
                }
                $groupBigman = Arr::get($overrides, 'bigman', []);
                if (is_array($groupBigman)) {
                    $bigmanConfig['token'] = $groupBigman['token'] ?? $bigmanConfig['token'];
                    $bigmanConfig['depositEndpoint'] = $groupBigman['depositEndpoint'] ?? $bigmanConfig['depositEndpoint'];
                    $bigmanConfig['withdrawEndpoint'] = $groupBigman['withdrawEndpoint'] ?? $bigmanConfig['withdrawEndpoint'];
                }
            }
        } catch (\Throwable $_) {
            // ignore config errors
        }

        $endpointToUse = $bigmanConfig['depositEndpoint'];

        if (!is_string($endpointToUse) || trim($endpointToUse) === '') {
            return;
        }

        // build payload for deposit only (withdraw is currently disabled)
        if ($transactionType === 'deposit') {
            // Prefer the confirmed username attached by the AI session, then
            // fall back to OCR account holder name, then to conversation user.
            $usernameForBigman = (string) ($best['user_id'] ?? '');
            if ($usernameForBigman === '') {
                $usernameForBigman = (string) ($best['from_account_name'] ?? $username);
            }

            $payload = [
                'from_account_name' => (string) ($best['from_account_name'] ?? ''),
                'amount' => $amountInt,
                'username' => $usernameForBigman,
                'is_diff_name' => (bool) ($best['is_diff_name'] ?? false),
            ];

            // optionally send bank name when we have one and no explicit payment method
            if (!empty($best['from_bank'])) {
                $payload['from_account_bank'] = (string) $best['from_bank'];
            }

            // include payment method if OCR provided it (e.g. "qris", "e-wallet")
            if (!empty($best['payment_method'])) {
                $payload['payment_method'] = (string) $best['payment_method'];
            }
        }

        try {
            $client = new Client(['timeout' => 15]);
            $requestId = (string) Str::uuid();
            $headers = [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'X-Request-Id' => $requestId,
            ];
            if (!empty($bigmanConfig['token'])) {
                $headers['Authorization'] = 'Bearer ' . $bigmanConfig['token'];
            }

            $response = $client->post($endpointToUse, [
                'headers' => $headers,
                'json' => $payload,
            ]);

            $statusCode = $response->getStatusCode();
            $rawBody = (string) $response->getBody();
            $bodyArray = null;
            try {
                $decoded = json_decode($rawBody, true);
                if (is_array($decoded)) {
                    $bodyArray = $decoded;
                }
            } catch (\Throwable $_) {
                $bodyArray = null;
            }

            $accepted = $statusCode === 200 && is_array($bodyArray) && (($bodyArray['success'] ?? null) === true);
            $usedDiffName = (bool) ($best['is_diff_name'] ?? false);

            // Determine whether BigMan indicates a missing/unknown ticket.
            // This may happen even if the payload is well-formed, so we prompt
            // the user to confirm whether the registered name differs from the
            // transfer name and then retry with is_diff_name=true.
            $bigmanMessage = is_array($bodyArray) ? ($bodyArray['message'] ?? '') : '';
            $bigmanMessage = is_string($bigmanMessage) ? $bigmanMessage : '';
            $rawSearchText = mb_strtolower(trim((string) $rawBody));
            $messageSearchText = mb_strtolower(trim((string) $bigmanMessage));
            $ticketNotFoundPattern = '/(ticket\s*not\s*found|no\s*ticket|ticket\s*not\s*exist|ticket\s*does\s*not\s*exist|tidak\s*ditemukan|ticket\s*tidak\s*ada|not\s*found)/iu';
            $ticketNotFound =
                ($statusCode === 404) ||
                (bool) preg_match($ticketNotFoundPattern, $messageSearchText) ||
                (bool) preg_match($ticketNotFoundPattern, $rawSearchText);

            // Persist BigMan status on the message for UI/agent visibility.
            try {
                $message = ConversationItem::find($this->messageId);
                if ($message) {
                    $data = is_array($message->data ?? null) ? $message->data : [];
                    $bankProof = is_array($data['bank_proof'] ?? null) ? $data['bank_proof'] : [];
                    $bankProof['bigman'] = [
                        'accepted' => $accepted,
                        'status_code' => $statusCode,
                        'message' => $bigmanMessage,
                        'ticket_not_found' => $ticketNotFound,
                        'request_id' => $requestId,
                        'attempts' => ($message->data['bank_proof']['bigman']['attempts'] ?? 0) + 1,
                        'response' => is_array($bodyArray) ? $bodyArray : $rawBody,
                    ];
                    $data['bank_proof'] = $bankProof;
                    $message->data = $data;
                    $message->save();
                    // Tell frontend to refresh this message
                    event(new \App\Conversations\Events\ConversationMessageCreated(
                        $conversation,
                        $message
                    ));
                }
            } catch (\Throwable $e) {
                Log::warning('BankProof: failed to persist BigMan status on message', [
                    'conversation_id' => $conversation->id,
                    'message_id' => $this->messageId,
                    'error' => $e->getMessage(),
                ]);
            }

            // If BigMan says the ticket isn't found, prompt the user to confirm
            // whether the registered name differs from the transfer name.
            if (!$accepted && $ticketNotFound) {
                try {
                    $session = \Ai\AiAgent\Models\AiAgentSession::firstOrCreate(
                        ['conversation_id' => $conversation->id],
                        ['status' => \Ai\AiAgent\Models\AiAgentSession::STATUS_ACTIVE, 'context' => []],
                    );
                    $ctx = is_array($session->context ?? null) ? $session->context : [];

                    if ($usedDiffName) {
                        // We already retried with is_diff_name=true; do not ask
                        // the same question again, mark as final not found.
                        if (empty($ctx['bigman_ticket_not_found_final_notified'])) {
                            $ctx['bigman_ticket_not_found_final_notified'] = true;
                            $ctx['awaiting_bigman_diff_name'] = false;
                            unset($ctx['bigman_diff_proof_message_id']);
                            $session->context = $ctx;
                            $session->save();

                            if (!$suppressAutoReply) {
                                try {
                                    (new \App\Conversations\Messages\CreateConversationMessage())->execute($conversation, [
                                        'type' => 'message',
                                        'author' => Conversation::AUTHOR_BOT,
                                        'body' => 'Bos, sudah dicek ulang termasuk skenario nama berbeda, tapi tiket tetap tidak ditemukan di sistem. Berarti tiketnya memang tidak ada.',
                                    ]);
                                } catch (\Throwable $_) {
                                    // ignore
                                }
                            }
                        }
                    } else {
                        if (empty($ctx['awaiting_bigman_diff_name'])) {
                            $ctx['awaiting_bigman_diff_name'] = true;
                            $ctx['bigman_diff_proof_message_id'] = $this->messageId;
                            $session->context = $ctx;
                            $session->save();

                            if (!$suppressAutoReply) {
                                try {
                                    (new \App\Conversations\Messages\CreateConversationMessage())->execute($conversation, [
                                        'type' => 'message',
                                        'author' => Conversation::AUTHOR_BOT,
                                        'body' => 'Bos, nama akun terdaftar berbeda dengan nama di bukti transfer? Kalau iya jawab "ya", kalau tidak jawab "tidak".',
                                    ]);
                                } catch (\Throwable $_) {
                                    // ignore
                                }
                            }
                        }
                    }
                } catch (\Throwable $_) {
                    // best-effort only
                }
            }

            Log::info('BankProof: BigMan async API call completed', [
                'conversation_id' => $conversation->id,
                'message_id' => $this->messageId,
                'transaction_type' => $transactionType,
                'status' => $statusCode,
                'accepted' => $accepted,
                'request_id' => $requestId,
            ]);
        } catch (\Throwable $e) {
            Log::warning('BankProof: BigMan async API call failed', [
                'conversation_id' => $conversation->id,
                'message_id' => $this->messageId,
                'transaction_type' => $transactionType,
                'endpoint' => $endpointToUse,
                'error' => $e->getMessage(),
            ]);

            // Persist failure status as well so UI can show that connection failed
            try {
                $message = ConversationItem::find($this->messageId);
                if ($message) {
                    $data = is_array($message->data ?? null) ? $message->data : [];
                    $bankProof = is_array($data['bank_proof'] ?? null) ? $data['bank_proof'] : [];
                    $bankProof['bigman'] = [
                        'accepted' => false,
                        'status_code' => null,
                        'message' => $e->getMessage(),
                        'request_id' => $requestId ?? null,
                        'attempts' => ($message->data['bank_proof']['bigman']['attempts'] ?? 0) + 1,
                        'response' => $e->getMessage(),
                    ];
                    $data['bank_proof'] = $bankProof;
                    $message->data = $data;
                    $message->save();
                    event(new \App\Conversations\Events\ConversationMessageCreated(
                        $conversation,
                        $message
                    ));
                }
            } catch (\Throwable $_) {
                // swallow secondary persistence errors
            }
        }
    }
}
