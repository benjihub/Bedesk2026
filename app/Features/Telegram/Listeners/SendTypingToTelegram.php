<?php

namespace App\Features\Telegram\Listeners;

use App\Conversations\Events\ConversationTyping;
use App\Conversations\Models\Conversation;
use App\Features\Telegram\Contracts\TelegramClientInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendTypingToTelegram
{
    public function __construct(private TelegramClientInterface $telegramClient)
    {
    }

    public function handle(ConversationTyping $event): void
    {
        $conversation = $event->conversation;

        if ($conversation->channel !== 'telegram') {
            return;
        }

        // Forward typing only from agent/bot side to Telegram customer.
        if (!in_array($event->author, [Conversation::AUTHOR_AGENT, Conversation::AUTHOR_BOT], true)) {
            return;
        }

        if (!$event->isTyping) {
            return;
        }

        $chatId = $this->getChatIdFromConversation($conversation);
        if (!$chatId) {
            return;
        }

        // Prevent flooding Telegram typing endpoint while user is still typing.
        $throttleKey = "telegram:typing:{$conversation->id}:{$chatId}";
        if (!Cache::add($throttleKey, 1, now()->addSeconds(4))) {
            return;
        }

        try {
            $response = $this->telegramClient->sendTypingIndicator((string) $chatId);
            if (isset($response['ok']) && $response['ok'] === false) {
                Log::warning('Failed to send Telegram typing indicator', [
                    'conversation_id' => $conversation->id,
                    'chat_id' => $chatId,
                    'response' => $response,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to send Telegram typing indicator', [
                'conversation_id' => $conversation->id,
                'chat_id' => $chatId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function getChatIdFromConversation(Conversation $conversation): ?string
    {
        $messageWithChatData = $conversation->messages()
            ->whereNotNull('data')
            ->where('data->provider', 'telegram')
            ->latest('id')
            ->first();

        if ($messageWithChatData && isset($messageWithChatData->data['chat']['id'])) {
            return (string) $messageWithChatData->data['chat']['id'];
        }

        return null;
    }
}
