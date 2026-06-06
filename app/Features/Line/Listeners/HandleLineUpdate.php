<?php

namespace App\Features\Line\Listeners;

use App\Features\Line\Domain\Events\IncomingMessageReceived;
use App\Features\Line\Models\LineAccount;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Events\ConversationTyping;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Conversations\Events\ConversationCreated;
use App\Team\Models\Group;
use App\Models\User;
use Common\Files\Actions\CreateFileEntry;
use Common\Files\Actions\StoreFile;
use Common\Files\FileEntryPayload;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Http;

class HandleLineUpdate
{
    public function handle(IncomingMessageReceived $event): void
    {
        $incoming = $event->incoming;
        $storedMessageId = $event->storedMessageId ?? null;
        $accountId = $event->accountId ?? null;
        $aiEnabled = (bool) settings('aiAgent.enabled');

        try {
            $status = ConversationStatus::getDefaultOpen();
            $groupId = Group::findDefault()?->id;

            $senderId = $incoming->contactId ?? $incoming->from ?? null;

            $user = null;
            if ($senderId) {
                $email = "line_{$senderId}@line.local";
                $user = User::where('email', $email)->first();
                if (!$user) {
                    $userData = [
                        'email' => $email,
                        'password' => Str::random(32),
                    ];

                    if (Schema::hasColumn('users', 'first_name')) {
                        $userData['first_name'] = $incoming->contactName ?? 'LINE user';
                    }

                    if (Schema::hasColumn('users', 'username')) {
                        $userData['username'] = null;
                    }

                    $user = User::create($userData);
                }
            }

            $conversation = Conversation::where('user_id', $user?->id)
                ->where('channel', 'line')
                ->where('status_category', '>', Conversation::STATUS_CLOSED)
                ->first();

            if (!$conversation) {
                $conversation = Conversation::create([
                    'type' => 'ticket',
                    'status_id' => $status?->id ?? null,
                    'status_category' => $status?->category ?? Conversation::STATUS_OPEN,
                    'group_id' => $groupId,
                    'channel' => 'line',
                    'assigned_to' => $aiEnabled
                        ? Conversation::ASSIGNED_BOT
                        : Conversation::ASSIGNED_AGENT,
                    'ai_agent_involved' => $aiEnabled,
                    'request_ip' => request()?->ip(),
                    'user_id' => $user?->id ?? null,
                ]);

                if ($user) {
                    $conversation->setRelation('user', $user);
                }
            } elseif ($aiEnabled && $this->canRouteConversationBackToBot($conversation)) {
                $conversation->update([
                    'assigned_to' => Conversation::ASSIGNED_BOT,
                    'assignee_id' => null,
                    'assigned_at' => null,
                    'ai_agent_involved' => true,
                ]);
            }

            event(new ConversationTyping($conversation, Conversation::AUTHOR_USER, true));

            $body = $incoming->body ?? '[line update] ' . json_encode($incoming->raw);
            $imageAttachmentIds = $this->extractLineImageAttachmentIds(
                $incoming,
                $accountId,
                $user?->id,
            );

            $messagePayload = [
                'body' => $body,
                'author' => Conversation::AUTHOR_USER,
                'data' => [
                    'provider' => 'line',
                    'account_id' => $accountId,
                    'line' => [
                        'from' => $incoming->from,
                        'to' => $incoming->to,
                        'contact_id' => $incoming->contactId,
                        'contact_name' => $incoming->contactName,
                        'provider_message_id' => $incoming->providerMessageId,
                        'stored_line_message_id' => $storedMessageId,
                    ],
                    'update' => $incoming->raw,
                ],
                'type' => 'message',
                'uuid' => (string) Str::uuid(),
                'created_at' => now(),
            ];

            if (!empty($imageAttachmentIds)) {
                $messagePayload['attachments'] = $imageAttachmentIds;
            }

            (new CreateConversationMessage())->execute($conversation, $messagePayload);
            event(new ConversationTyping($conversation, Conversation::AUTHOR_USER, false));

            $this->triggerAiReply($conversation);

            event(new ConversationCreated($conversation));
        } catch (\Throwable $e) {
            Log::error('Failed to process LINE update', ['error' => $e->getMessage(), 'incoming' => $incoming]);
        }
    }

    private function triggerAiReply(Conversation $conversation): void
    {
        if (!class_exists(\Livechat\Widget\HandleLatestUserMessage::class)) {
            return;
        }

        try {
            (new \Livechat\Widget\HandleLatestUserMessage($conversation->fresh()))->execute();
        } catch (\Throwable $e) {
            Log::error('Failed to trigger AI reply for LINE conversation', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function canRouteConversationBackToBot(Conversation $conversation): bool
    {
        $session = $conversation->aiAgentSession()->first();
        $context = is_array($session?->context ?? null) ? $session->context : [];

        // Respect active human handoff initiated by AI workflows.
        if (!empty($context['support_handoff_active'])) {
            return false;
        }

        return true;
    }

    private function extractLineImageAttachmentIds(
        mixed $incoming,
        ?int $accountId,
        ?int $ownerId,
    ): array {
        if (($incoming->type ?? null) !== 'image') {
            return [];
        }

        $messageId = $incoming->raw['message']['id'] ?? $incoming->providerMessageId ?? null;
        if (!$messageId) {
            return [];
        }

        $entryId = $this->downloadAndStoreLineImage(
            (string) $messageId,
            $accountId,
            $ownerId,
        );

        return $entryId ? [$entryId] : [];
    }

    private function downloadAndStoreLineImage(
        string $messageId,
        ?int $accountId,
        ?int $ownerId,
    ): ?int {
        $tokens = [];
        if ($accountId) {
            $accountToken = LineAccount::find($accountId)?->channel_token;
            if (is_string($accountToken) && $accountToken !== '') {
                $tokens['account'] = $accountToken;
            }
        }

        $configToken = config('line.channel_token');
        if (is_string($configToken) && $configToken !== '') {
            $tokens['config'] = $configToken;
        }

        if (empty($tokens)) {
            Log::warning('LINE channel token missing while downloading image', [
                'message_id' => $messageId,
            ]);
            return null;
        }

        $baseUrl = rtrim((string) config('line.data_api_base_url', 'https://api-data.line.me'), '/');
        $downloadResponse = null;
        $lastFailure = null;

        foreach ($tokens as $source => $token) {
            $response = Http::withToken($token)
                ->timeout(30)
                ->get("{$baseUrl}/v2/bot/message/{$messageId}/content");

            if ($response->ok()) {
                $downloadResponse = $response;
                break;
            }

            $lastFailure = [
                'source' => $source,
                'status' => $response->status(),
                'body' => mb_substr((string) $response->body(), 0, 500),
            ];
        }

        if (!$downloadResponse) {
            Log::warning('LINE image download failed', [
                'message_id' => $messageId,
                'failure' => $lastFailure,
            ]);
            return null;
        }

        $contents = $downloadResponse->body();
        if ($contents === '') {
            return null;
        }

        $mimeHeader = (string) ($downloadResponse->header('Content-Type') ?: 'image/jpeg');
        $mime = strtolower(trim(explode(';', $mimeHeader)[0]));
        $extension = match ($mime) {
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'jpg',
        };

        $payload = new FileEntryPayload([
            'clientName' => "line_{$messageId}.{$extension}",
            'clientMime' => $mime,
            'clientExtension' => $extension,
            'clientSize' => strlen($contents),
            'ownerId' => $ownerId,
            'uploadType' => Conversation::IMAGE_UPLOAD_TYPE,
        ]);

        (new StoreFile())->execute($payload, ['contents' => $contents]);
        $fileEntry = (new CreateFileEntry())->execute($payload);

        return $fileEntry->id;
    }
}
