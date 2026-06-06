<?php

namespace App\Conversations\Listeners;

use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Jobs\SendBankProofToBigman;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Ai\AiAgent\Models\AiAgentSession;
use Common\Files\FileEntry;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use GuzzleHttp\Client;

class ProcessBankProofImage
{
    /**
     * Handle customer image messages: extract bank proof fields, send to API, and handoff.
     */
    public function handle(ConversationMessageCreated $event): void
    {
        $conversation = $event->conversation;
        $message = $event->message;

        Log::info('ProcessBankProofImage: Event received', [
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
            'author' => $message->author ?? null,
            'is_normal_mode' => $conversation->isNormalMode(),
        ]);

        // Only process normal mode, user-authored messages
        if (!$conversation->isNormalMode()) {
            Log::info('ProcessBankProofImage: Skipping - not normal mode');
            return;
        }
        if (($message->author ?? null) !== Conversation::AUTHOR_USER) {
            Log::info('ProcessBankProofImage: Skipping - not user author, got: ' . ($message->author ?? 'null'));
            return;
        }

        // If this message already has a bank_proof payload on it, we have
        // already processed its image once. ConversationMessageCreated can
        // fire again when we update the message (for example from the
        // SendBankProofToBigman job), so guard against re-processing and
        // creating a loop that would keep pinging the UI.
        $existingData = is_array($message->data ?? null) ? $message->data : [];
        if (!empty($existingData['bank_proof'])) {
            Log::info('ProcessBankProofImage: Skipping - bank_proof already present on message');
            return;
        }

        // Settings: feature toggle and endpoint
        $cfg = settings('bankProof') ?? [];
        if (!is_array($cfg)) { $cfg = []; }
        
        // Temporarily force enabled for testing
        $enabled = true; // (bool)($cfg['enabled'] ?? false);
        $minConfidence = (float)($cfg['minConfidence'] ?? 0.6);

        // Require feature to be enabled, but do not require endpoint.
        // If endpoint is missing, we'll still persist extracted data for UI testing,
        // and skip posting to external API.
        if (!$enabled) {
            Log::info('ProcessBankProofImage: Skipping - feature disabled', ['cfg' => $cfg]);
            return; // disabled
        }

        // Find image attachments
        $attachments = $message->attachments()->get();
        Log::info('ProcessBankProofImage: Found attachments', [
            'message_id' => $message->id,
            'attachment_count' => $attachments->count(),
        ]);
        
        $images = $attachments->filter(function (FileEntry $entry) {
            $mime = strtolower((string)$entry->mime);
            return Str::startsWith($mime, 'image/');
        });

        Log::info('ProcessBankProofImage: Found images', [
            'message_id' => $message->id,
            'image_count' => $images->count(),
            'image_mimes' => $images->pluck('mime')->toArray(),
        ]);

        if ($images->isEmpty()) {
            Log::info('ProcessBankProofImage: Skipping - no images found');
            return; // nothing to process
        }

        try {
            Log::info('ProcessBankProofImage: Starting extraction', [
                'message_id' => $message->id,
                'image_count' => $images->count(),
            ]);
            
            $best = null;
            foreach ($images as $entry) {
                Log::info('ProcessBankProofImage: Processing image', [
                    'file_id' => $entry->id,
                    'mime' => $entry->mime,
                ]);
                
                $result = $this->extractFieldsFromImage($entry);
                if (!$result) { 
                    Log::info('ProcessBankProofImage: No result from extraction', ['file_id' => $entry->id]);
                    continue; 
                }
                
                Log::info('ProcessBankProofImage: Extraction successful', [
                    'file_id' => $entry->id,
                    'confidence' => $result['confidence'] ?? null,
                    'has_to_bank' => !empty($result['to_bank']),
                    'has_amount' => !empty($result['amount']),
                ]);
                
                if (!$best || (($result['confidence'] ?? 0) > ($best['confidence'] ?? 0))) {
                    $best = $result;
                }
            }

            if (!$best) { 
                Log::info('ProcessBankProofImage: No successful extractions');
                return; 
            }

            // Validate essentials.
            // Standard bank transfer: require receiver-side + datetime + amount.
            $hasStandardReceiver = !empty($best['to_bank'] ?? null) && !empty($best['to_account_name'] ?? null);

            // E-money or wallet-style payments: allow missing receiver bank/name
            // if payment_method clearly indicates an e-money/wallet provider.
            $paymentMethod = strtolower((string)($best['payment_method'] ?? ''));
            $isEmoney = $paymentMethod !== '' && Str::contains($paymentMethod, [
                'e-money', 'emoney', 'e money',
                'dana', 'ovo', 'gopay', 'shopeepay',
                'e-wallet', 'ewallet', 'wallet',
                'qris', 'qr payment', 'qr code',
            ]);

            // Core fields that must always be present for any accepted proof.
            // Some slips (or history/mutasi views) may not show a clear date/time,
            // so we only require amount here and allow occurred_at to be null.
            $hasCore =
                isset($best['amount']) &&
                $best['amount'] !== null && $best['amount'] !== '';

            if (!$hasCore || (!$hasStandardReceiver && !$isEmoney)) {
                Log::info('BankProof: missing essential field(s) for this proof type', [
                    'message_id' => $message->id,
                    'conversation_id' => $conversation->id,
                    'to_bank' => $best['to_bank'] ?? null,
                    'to_account_name' => $best['to_account_name'] ?? null,
                    'payment_method' => $best['payment_method'] ?? null,
                    'occurred_at' => $best['occurred_at'] ?? null,
                    'amount' => $best['amount'] ?? null,
                ]);

                // If we are missing the account name for a standard bank transfer,
                // ask the user to provide it so we can retry the BigMan check.
                if ($hasCore && !$hasStandardReceiver && !$isEmoney && !empty($best['to_bank'])) {
                    // Persist the partial extraction so the UI can show it.
                    $best['need_account_name'] = true;
                    try {
                        $message->data = array_merge($message->data ?? [], [
                            'bank_proof' => $best,
                        ]);
                        $message->save();
                    } catch (\Throwable $_) {
                        // best effort
                    }

                    // Mark session so next user reply can be treated as the missing name.
                    try {
                        $session = $conversation->aiAgentSession()->firstOrCreate(
                            ['conversation_id' => $conversation->id],
                            ['status' => \Ai\AiAgent\Models\AiAgentSession::STATUS_ACTIVE, 'context' => []],
                        );
                        $ctx = is_array($session->context ?? null) ? $session->context : [];
                        $ctx['awaiting_bank_proof_account_name'] = true;
                        $ctx['bank_proof_message_id'] = $message->id;
                        $session->context = $ctx;
                        $session->save();
                    } catch (\Throwable $_) {
                        // best-effort only
                    }

                    try {
                        (new CreateConversationMessage())->execute($conversation, [
                            'type' => 'message',
                            'author' => Conversation::AUTHOR_BOT,
                            'body' => 'Bos, tolong kirim nama rekening pengirim nya',
                        ]);
                    } catch (\Throwable $_) {
                        // ignore
                    }
                }

                return; // ignore if core info missing or does not match any allowed pattern
            }
            if (($best['confidence'] ?? 0) < $minConfidence) {
                Log::info('BankProof: confidence below threshold, skipping', [
                    'message_id' => $message->id,
                    'conversation_id' => $conversation->id,
                    'confidence' => $best['confidence'] ?? null,
                    'min_confidence' => $minConfidence,
                ]);
                return; // not confident enough
            }

            // Even if core fields are valid, BigMan still needs the transfer
            // account-holder name. If OCR did not capture it, ask user first
            // and postpone BigMan submission until they provide the name.
            $missingSenderName = !isset($best['from_account_name']) || trim((string) ($best['from_account_name'] ?? '')) === '';
            if ($missingSenderName) {
                $best['need_account_name'] = true;
                try {
                    $message->data = array_merge($message->data ?? [], [
                        'bank_proof' => $best,
                    ]);
                    $message->save();
                } catch (\Throwable $_) {
                    // best effort
                }

                try {
                    $session = $conversation->aiAgentSession()->firstOrCreate(
                        ['conversation_id' => $conversation->id],
                        ['status' => \Ai\AiAgent\Models\AiAgentSession::STATUS_ACTIVE, 'context' => []],
                    );
                    $ctx = is_array($session->context ?? null) ? $session->context : [];
                    $ctx['awaiting_bank_proof_account_name'] = true;
                    $ctx['bank_proof_message_id'] = $message->id;
                    $session->context = $ctx;
                    $session->save();
                } catch (\Throwable $_) {
                    // best-effort only
                }

                try {
                    (new CreateConversationMessage())->execute($conversation, [
                        'type' => 'message',
                        'author' => Conversation::AUTHOR_BOT,
                        'body' => 'Bos, tolong kirim nama rekening pengirim nya',
                    ]);
                } catch (\Throwable $_) {
                    // ignore
                }

                return;
            }

            // Attach confirmed username from AI session (if any) so
            // downstream deposit checks can tie proof to the same ID.
            try {
                $session = $conversation->aiAgentSession()->first();
                $ctx = is_array($session?->context ?? null) ? $session->context : [];
                $confirmedUsername = isset($ctx['confirmed_username']) && is_string($ctx['confirmed_username']) && trim($ctx['confirmed_username']) !== ''
                    ? trim($ctx['confirmed_username'])
                    : null;
                $best['user_id'] = $confirmedUsername ?? '';
            } catch (\Throwable $_) {
                // best-effort only
                $best['user_id'] = '';
            }

            // Persist on message for UI/testing
            try {
                $message->data = array_merge($message->data ?? [], [
                    'bank_proof' => $best,
                ]);
                $message->save();
            } catch (\Throwable $e) {
                Log::warning('Failed to persist bank_proof on message', [
                    'message_id' => $message->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Call BigMan synchronously instead of queuing, so we don't
            // depend on a separate queue worker for this feature.
            try {
                // mark pending so frontend can briefly show placeholder; the
                // SendBankProofToBigman job will overwrite this with the
                // final BigMan response synchronously.
                $best['bigman'] = ['pending' => true];
                $message->data = array_merge($message->data ?? [], ['bank_proof' => $best]);
                $message->save();

                (new SendBankProofToBigman($conversation->id, $message->id, $best))->handle();
            } catch (\Throwable $e) {
                Log::warning('BankProof: failed to run BigMan check', [
                    'conversation_id' => $conversation->id,
                    'message_id' => $message->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // NOTE: Do not modify AI session or assignment here; AI should continue
            // responding normally even after bank proof extraction and BigMan call.
        } catch (\Throwable $e) {
            Log::error('ProcessBankProofImage failed', [
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Extract fields from an image using OpenAI Responses API with base64 image input.
     * Returns array with keys or null on failure.
     */
    protected function extractFieldsFromImage(FileEntry $entry): ?array
    {
        try {
            $disk = $entry->getDisk();
            $path = $entry->getStoragePath();
            $bytes = $disk->get($path);
            if (!is_string($bytes)) { return null; }

            $mime = strtolower((string)$entry->mime) ?: 'image/jpeg';
            $b64 = base64_encode($bytes);
            $dataUrl = 'data:' . $mime . ';base64,' . $b64;

            $apiKey = config('services.openai.api_key') ?? env('OPENAI_API_KEY');
            $model = config('services.openai.text_model') ?? env('OPENAI_TEXT_MODEL') ?? env('OPENAI_MODEL') ?? 'gpt-4o-mini';
            if (!$apiKey) { return null; }

            $client = new Client(['timeout' => 30]);

            $instructions = "Extract ONLY the following fields from the provided bank transfer proof image. If a field is not present or you are not certain about its value, set it to null. Do NOT guess or infer values. Return ONLY a single JSON object, no prose or explanation.\n\nFields:\n- from_bank (string)\n- from_account_name (string)\n- from_account_number (string|null)\n- to_bank (string)\n- to_account_name (string)\n- to_account_number (string|null)\n- occurred_at (string ISO8601)\n- amount (number)\n- currency (string|null)\n- reference_number (string|null)\n- payment_method (string|null, e.g. 'mobile banking', 'ATM', 'internet banking', 'teller', 'QRIS', 'e-wallet')\n- confidence (number 0-1)";

            $response = $client->post('https://api.openai.com/v1/responses', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $model,
                    'instructions' => $instructions,
                    'input' => [
                        [
                            'role' => 'user',
                            'content' => [
                                ['type' => 'input_text', 'text' => 'Please analyze this image and extract fields.'],
                                ['type' => 'input_image', 'image_url' => $dataUrl],
                            ],
                        ],
                    ],
                    'store' => false,
                ],
            ]);

            $body = json_decode((string)$response->getBody(), true);
            $data = null;
            // Prefer aggregated text if present
            $outputText = $body['output_text'] ?? null;
            if (is_string($outputText) && trim($outputText) !== '') {
                $decoded = $this->decodeJsonFromText($outputText);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }
            // Fallback to structured output array (output_json or output_text)
            if (!$data && isset($body['output']) && is_array($body['output'])) {
                foreach ($body['output'] as $out) {
                    if (!isset($out['content']) || !is_array($out['content'])) { continue; }
                    foreach ($out['content'] as $c) {
                        if (($c['type'] ?? null) === 'output_json' && is_array($c['json'] ?? null)) {
                            $data = $c['json'];
                            break 2;
                        }
                        if (($c['type'] ?? null) === 'output_text' && is_string($c['text'] ?? null)) {
                            $decoded = $this->decodeJsonFromText($c['text']);
                            if (is_array($decoded)) {
                                $data = $decoded;
                                break 2;
                            }
                        }
                    }
                }
            }
            if (!is_array($data)) { return null; }
            // Normalize keys
            $data['confidence'] = isset($data['confidence']) ? (float)$data['confidence'] : 0.0;
            return $data;
        } catch (\Throwable $e) {
            Log::warning('BankProof extraction failed', [
                'entry_id' => $entry->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
    
    /**
     * Decode JSON, being tolerant of markdown ```json fences around the payload.
     */
    protected function decodeJsonFromText(string $text): ?array
    {
        $trimmed = trim($text);
        // Strip leading and trailing markdown code fences like ```json ... ```
        if (Str::startsWith($trimmed, '```')) {
            // remove opening fence with optional language and following newline/space
            $trimmed = preg_replace('/^```[a-zA-Z0-9_-]*\s*/', '', $trimmed);
            // remove closing fence at the end
            $trimmed = preg_replace('/```$/', '', trim($trimmed));
        }

        $decoded = json_decode($trimmed, true);
        return is_array($decoded) ? $decoded : null;
    }
}
