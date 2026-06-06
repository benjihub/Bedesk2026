<?php

namespace App\Features\Whatsapp\Listeners;

use App\Features\Whatsapp\Domain\Events\IncomingMessageReceived;
use App\Features\Whatsapp\Models\WhatsappAccount;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Conversations\Events\ConversationCreated;
use App\Conversations\Events\ConversationTyping;
use App\Team\Models\Group;
use App\Models\User;
use Common\Files\Actions\CreateFileEntry;
use Common\Files\Actions\StoreFile;
use Common\Files\FileEntryPayload;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class HandleWhatsappUpdate
{
    public function handle(IncomingMessageReceived $event): void
    {
        $incoming = $event->message;
        $storedMessageId = $event->storedMessageId ?? null;
        $accountId = $event->accountId ?? null;
        $aiEnabled = (bool) settings('aiAgent.enabled');

        try {
            $status = ConversationStatus::getDefaultOpen();
            $groupId = Group::findDefault()?->id;

            $senderId = $incoming->contactWaId ?? $incoming->from ?? null;

            $user = null;
            if ($senderId) {
                $email = "whatsapp_{$senderId}@whatsapp.local";
                $user = User::where('email', $email)->first();
                if (!$user) {
                    $userData = [
                        'email' => $email,
                        'password' => Str::random(32),
                    ];

                    if (Schema::hasColumn('users', 'first_name')) {
                        $userData['first_name'] = $incoming->contactName ?? 'WhatsApp user';
                    }

                    if (Schema::hasColumn('users', 'username')) {
                        $userData['username'] = null;
                    }

                    $user = User::create($userData);
                }
            }

            $conversation = Conversation::where('user_id', $user?->id)
                ->where('channel', 'whatsapp')
                ->where('status_category', '>', Conversation::STATUS_CLOSED)
                ->first();

            if (!$conversation) {
                $conversation = Conversation::create([
                    'type' => 'ticket',
                    'status_id' => $status?->id ?? null,
                    'status_category' => $status?->category ?? Conversation::STATUS_OPEN,
                    'group_id' => $groupId,
                    'channel' => 'whatsapp',
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

            $body = $incoming->body ?? (($incoming->type ?? null) === 'image'
                ? '[image]'
                : '[whatsapp update] ' . json_encode($incoming->raw));
            $imageAttachmentIds = $this->extractWhatsappImageAttachmentIds(
                $incoming,
                $accountId,
                $user?->id,
            );

            $messagePayload = [
                'body' => $body,
                'author' => Conversation::AUTHOR_USER,
                'data' => [
                    'provider' => 'whatsapp',
                    'account_id' => $accountId,
                    'whatsapp' => [
                        'from' => $incoming->from,
                        'to' => $incoming->to,
                        'contact_id' => $incoming->contactWaId ?? $incoming->from,
                        'contact_name' => $incoming->contactName,
                        'provider_message_id' => $incoming->providerMessageId,
                        'stored_whatsapp_message_id' => $storedMessageId,
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
            Log::error('Failed to process WhatsApp update', ['error' => $e->getMessage(), 'incoming' => $incoming]);
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
            Log::error('Failed to trigger AI reply for WhatsApp conversation', [
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

    private function extractWhatsappImageAttachmentIds(
        mixed $incoming,
        ?int $accountId,
        ?int $ownerId,
    ): array {
        if (($incoming->type ?? null) !== 'image') {
            return [];
        }

        $mediaId = data_get($incoming->raw, 'image.id');
        $mediaUrl = data_get($incoming->raw, 'image.url');
        $mimeType = data_get($incoming->raw, 'image.mime_type');

        if (!$mediaId && !$mediaUrl) {
            return [];
        }

        $entryId = $this->downloadAndStoreWhatsappImage(
            is_string($mediaId) ? $mediaId : null,
            is_string($mediaUrl) ? $mediaUrl : null,
            is_string($mimeType) ? $mimeType : null,
            $accountId,
            $ownerId,
        );

        return $entryId ? [$entryId] : [];
    }

    private function downloadAndStoreWhatsappImage(
        ?string $mediaId,
        ?string $mediaUrl,
        ?string $mimeType,
        ?int $accountId,
        ?int $ownerId,
    ): ?int {
        $tokens = [];

        if ($accountId) {
            $accountToken = WhatsappAccount::find($accountId)?->access_token;
            if (is_string($accountToken) && $accountToken !== '') {
                $tokens['account'] = $accountToken;
            }
        }

        $configToken = config('whatsapp.access_token');
        if (is_string($configToken) && $configToken !== '') {
            $tokens['config'] = $configToken;
        }

        if (empty($tokens)) {
            Log::warning('WhatsApp access token missing while downloading image', [
                'media_id' => $mediaId,
            ]);
            return null;
        }

        $baseUrl = rtrim((string) config('whatsapp.api_base_url', 'https://graph.facebook.com/v22.0'), '/');
        $downloadResponse = null;
        $lastFailure = null;

        foreach ($tokens as $source => $token) {
            $resolvedUrl = null;

            // Prefer resolving a fresh signed media URL from media ID.
            if ($mediaId) {
                $metaResponse = Http::withToken($token)
                    ->acceptJson()
                    ->timeout(20)
                    ->get("{$baseUrl}/{$mediaId}");

                if ($metaResponse->ok()) {
                    $resolvedUrl = data_get($metaResponse->json(), 'url');
                } else {
                    $lastFailure = [
                        'stage' => 'metadata',
                        'source' => $source,
                        'status' => $metaResponse->status(),
                        'body' => mb_substr((string) $metaResponse->body(), 0, 500),
                    ];
                }
            }

            // Fallback to webhook-provided URL when metadata URL is unavailable.
            if (!is_string($resolvedUrl) || $resolvedUrl === '') {
                $resolvedUrl = $mediaUrl;
            }

            if (!is_string($resolvedUrl) || $resolvedUrl === '') {
                $lastFailure = [
                    'stage' => 'metadata',
                    'source' => $source,
                    'status' => null,
                    'body' => 'Media URL not available',
                ];
                continue;
            }

            $response = Http::withToken($token)
                ->timeout(30)
                ->get($resolvedUrl);

            if ($response->ok()) {
                $downloadResponse = $response;
                break;
            }

            $lastFailure = [
                'stage' => 'download',
                'source' => $source,
                'status' => $response->status(),
                'body' => mb_substr((string) $response->body(), 0, 500),
            ];
        }

        if (!$downloadResponse) {
            Log::warning('WhatsApp image download failed', [
                'media_id' => $mediaId,
                'failure' => $lastFailure,
            ]);
            return null;
        }

        $contents = $downloadResponse->body();
        if ($contents === '') {
            return null;
        }

        $mimeHeader = (string) ($downloadResponse->header('Content-Type') ?: $mimeType ?: 'image/jpeg');
        $mime = strtolower(trim(explode(';', $mimeHeader)[0]));
        $extension = match ($mime) {
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'jpg',
        };

        $nameToken = $mediaId ?: (string) Str::uuid();
        $payload = new FileEntryPayload([
            'clientName' => "whatsapp_{$nameToken}.{$extension}",
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
