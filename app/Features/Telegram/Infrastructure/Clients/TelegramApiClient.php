<?php

namespace App\Features\Telegram\Infrastructure\Clients;

use App\Features\Telegram\Contracts\TelegramClientInterface;
use Illuminate\Support\Facades\Http;

class TelegramApiClient implements TelegramClientInterface
{
    public function sendMessage(string $chatId, string $text): array
    {
        $token = config('telegram.bot_token');

        if (empty($token)) {
            return ['error' => 'bot token not configured'];
        }

        $resp = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
        ]);

        return $resp->json();
    }

    public function sendTypingIndicator(string $chatId): array
    {
        $token = config('telegram.bot_token');

        if (empty($token)) {
            return ['error' => 'bot token not configured'];
        }

        $resp = Http::post("https://api.telegram.org/bot{$token}/sendChatAction", [
            'chat_id' => $chatId,
            'action' => 'typing',
        ]);

        return $resp->json();
    }
}
