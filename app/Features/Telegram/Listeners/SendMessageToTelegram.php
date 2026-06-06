<?php

namespace App\Features\Telegram\Listeners;

use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Models\Conversation;
use App\Features\Telegram\Contracts\TelegramClientInterface;
use Illuminate\Support\Facades\Log;

class SendMessageToTelegram
{
    public function __construct(
        private TelegramClientInterface $telegramClient,
    ) {}

    public function handle(ConversationMessageCreated $event): void
    {
        $conversation = $event->conversation;
        $message = $event->message;

        // Only send messages for Telegram conversations
        if ($conversation->channel !== 'telegram') {
            return;
        }

        // Only send agent or bot messages (not user messages or system messages)
        if (!in_array($message->author, [Conversation::AUTHOR_AGENT, Conversation::AUTHOR_BOT], true)) {
            return;
        }

        // Get the chat_id from the conversation's message data
        $chatId = $this->getChatIdFromConversation($conversation);

        if (!$chatId) {
            Log::warning('Could not find chat_id for Telegram conversation', [
                'conversation_id' => $conversation->id,
            ]);
            return;
        }

        try {
            // Strip HTML tags for Telegram (Telegram doesn't render HTML in messages)
            $plainTextBody = strip_tags($message->body);
            
            $response = $this->telegramClient->sendMessage($chatId, $plainTextBody);

            if (isset($response['error'])) {
                Log::error('Failed to send message to Telegram', [
                    'conversation_id' => $conversation->id,
                    'message_id' => $message->id,
                    'chat_id' => $chatId,
                    'error' => $response['error'],
                ]);
            } else {
                Log::info('Message sent to Telegram successfully', [
                    'conversation_id' => $conversation->id,
                    'message_id' => $message->id,
                    'chat_id' => $chatId,
                    'telegram_message_id' => $response['result']['message_id'] ?? null,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Exception while sending message to Telegram', [
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
                'chat_id' => $chatId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function getChatIdFromConversation(Conversation $conversation): ?string
    {
        // Get the first message with chat data
        $messageWithChatData = $conversation->messages()
            ->whereNotNull('data')
            ->where('data->provider', 'telegram')
            ->first();

        if ($messageWithChatData && isset($messageWithChatData->data['chat']['id'])) {
            return (string) $messageWithChatData->data['chat']['id'];
        }

        return null;
    }
}