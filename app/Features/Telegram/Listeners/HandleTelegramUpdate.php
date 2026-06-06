<?php

namespace App\Features\Telegram\Listeners;

use App\Events\TelegramUpdateReceived;
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
use Livechat\Widget\HandleLatestUserMessage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Http;

class HandleTelegramUpdate
{
    public function handle(TelegramUpdateReceived $event): void
    {
        $update = $event->update ?? [];
        $aiEnabled = (bool) settings('aiAgent.enabled');

        // extract chat + text where possible
        $text = null;
        $chat = null;

        if (isset($update['message'])) {
            $chat = $update['message']['chat'] ?? null;
            $text = $update['message']['text'] ?? $update['message']['caption'] ?? null;
        } elseif (isset($update['channel_post'])) {
            $chat = $update['channel_post']['chat'] ?? null;
            $text = $update['channel_post']['text'] ?? $update['channel_post']['caption'] ?? null;
        } elseif (isset($update['edited_message'])) {
            $chat = $update['edited_message']['chat'] ?? null;
            $text = $update['edited_message']['text'] ?? null;
        } elseif (isset($update['callback_query'])) {
            $chat = $update['callback_query']['message']['chat'] ?? null;
            $text = $update['callback_query']['data'] ?? null;
        }

        try {
            $status = ConversationStatus::getDefaultOpen();
            $groupId = Group::findDefault()?->id;

            // prefer sender info when available to create/find a user
            $sender = $update['message']['from'] ?? $update['edited_message']['from'] ?? $update['callback_query']['from'] ?? null;
            $chatId = $chat['id'] ?? ($sender['id'] ?? null);

            $user = null;
            if ($chatId) {
                $email = "telegram_{$chatId}@telegram.local";
                $user = User::where('email', $email)->first();
                if (!$user) {
                    $userData = [
                        'email' => $email,
                        // password mutator will hash this
                        'password' => Str::random(32),
                    ];

                    if (Schema::hasColumn('users', 'first_name')) {
                        $userData['first_name'] = $sender['first_name'] ?? $sender['username'] ?? 'Telegram user';
                    }

                    if (Schema::hasColumn('users', 'username')) {
                        $userData['username'] = $sender['username'] ?? null;
                    }

                    $user = User::create($userData);
                }
            }

            // Check if there's already an open conversation for this user on Telegram
            $conversation = Conversation::where('user_id', $user?->id)
                ->where('channel', 'telegram')
                ->where('status_category', '>', Conversation::STATUS_CLOSED)
                ->first();

            if (!$conversation) {
                $conversation = Conversation::create([
                    'type' => 'ticket',
                    'status_id' => $status?->id ?? null,
                    'status_category' => $status?->category ?? Conversation::STATUS_OPEN,
                    'group_id' => $groupId,
                    'channel' => 'telegram',
                    'assigned_to' => $aiEnabled
                        ? Conversation::ASSIGNED_BOT
                        : Conversation::ASSIGNED_AGENT,
                    'ai_agent_involved' => $aiEnabled,
                    'request_ip' => request()?->ip(),
                    'user_id' => $user?->id ?? null,
                ]);

                // ensure relation is loaded for downstream code
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

            $hasPhoto = $this->updateHasPhoto($update);
            $body = $text ?? ($hasPhoto ? '[image]' : '[telegram update] ' . json_encode($update));
            $imageAttachmentIds = $this->extractTelegramImageAttachmentIds(
                $update,
                $user?->id,
            );

            $messagePayload = [
                'body' => $body,
                'author' => Conversation::AUTHOR_USER,
                'data' => [
                    'provider' => 'telegram',
                    'chat' => $chat,
                    'update' => $update,
                ],
                'type' => 'message',
                'uuid' => (string) Str::uuid(),
                'created_at' => now(),
            ];

            if (!empty($imageAttachmentIds)) {
                $messagePayload['attachments'] = $imageAttachmentIds;
            }

            event(new ConversationTyping($conversation, Conversation::AUTHOR_USER, true));
            (new CreateConversationMessage())->execute($conversation, $messagePayload);
            event(new ConversationTyping($conversation, Conversation::AUTHOR_USER, false));

            $this->triggerAiReply($conversation, $aiEnabled);

            event(new ConversationCreated($conversation));
        } catch (\Throwable $e) {
            Log::error('Failed to process Telegram update', ['error' => $e->getMessage(), 'update' => $update]);
        }
    }

    private function triggerAiReply(Conversation $conversation, bool $aiEnabled): void
    {
        if (!$aiEnabled) {
            return;
        }

        if (!class_exists(HandleLatestUserMessage::class)) {
            return;
        }

        try {
            (new HandleLatestUserMessage($conversation->fresh()))->execute();
        } catch (\Throwable $e) {
            Log::error('Failed to trigger AI reply for Telegram conversation', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function canRouteConversationBackToBot(Conversation $conversation): bool
    {
        $session = $conversation->aiAgentSession()->first();
        $context = is_array($session?->context ?? null) ? $session->context : [];

        if (!empty($context['support_handoff_active'])) {
            return false;
        }

        return true;
    }

    private function extractTelegramImageAttachmentIds(
        array $update,
        ?int $ownerId,
    ): array {
        $message =
            $update['message'] ??
            $update['edited_message'] ??
            $update['channel_post'] ??
            null;

        if (!is_array($message) || empty($message['photo'])) {
            return [];
        }

        $photoSizes = $message['photo'];
        if (!is_array($photoSizes)) {
            return [];
        }

        // Telegram provides multiple sizes for photos; use the largest one.
        usort($photoSizes, function ($a, $b) {
            return ($b['file_size'] ?? 0) <=> ($a['file_size'] ?? 0);
        });

        $fileId = $photoSizes[0]['file_id'] ?? null;
        if (!$fileId) {
            return [];
        }

        $entryId = $this->downloadAndStoreTelegramImage($fileId, $ownerId);

        return $entryId ? [$entryId] : [];
    }

    private function updateHasPhoto(array $update): bool
    {
        $message =
            $update['message'] ??
            $update['edited_message'] ??
            $update['channel_post'] ??
            null;

        return is_array($message) && !empty($message['photo']);
    }

    private function downloadAndStoreTelegramImage(
        string $fileId,
        ?int $ownerId,
    ): ?int {
        $token = config('telegram.bot_token');
        if (!$token) {
            Log::warning('Telegram bot token missing while downloading image');
            return null;
        }

        $fileMetaResponse = Http::timeout(20)->get(
            "https://api.telegram.org/bot{$token}/getFile",
            ['file_id' => $fileId],
        );

        if (!$fileMetaResponse->ok()) {
            Log::warning('Telegram getFile request failed', [
                'file_id' => $fileId,
                'status' => $fileMetaResponse->status(),
            ]);
            return null;
        }

        $filePath = data_get($fileMetaResponse->json(), 'result.file_path');
        if (!is_string($filePath) || $filePath === '') {
            Log::warning('Telegram getFile did not return file_path', [
                'file_id' => $fileId,
            ]);
            return null;
        }

        $downloadResponse = Http::timeout(30)->get(
            "https://api.telegram.org/file/bot{$token}/{$filePath}",
        );

        if (!$downloadResponse->ok()) {
            Log::warning('Telegram file download failed', [
                'file_id' => $fileId,
                'file_path' => $filePath,
                'status' => $downloadResponse->status(),
            ]);
            return null;
        }

        $contents = $downloadResponse->body();
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION) ?: 'jpg');
        $mime = match ($extension) {
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };

        $payload = new FileEntryPayload([
            'clientName' => "telegram_{$fileId}.{$extension}",
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
