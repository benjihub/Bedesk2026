<?php

namespace App\Features\Telegram\Application\Services;

use App\Features\Telegram\Contracts\TelegramClientInterface;

class TelegramMessageService
{
    protected TelegramClientInterface $client;

    public function __construct(TelegramClientInterface $client)
    {
        $this->client = $client;
    }

    public function send(array $payload): array
    {
        $chatId = $payload['chat_id'] ?? null;
        $text = $payload['text'] ?? null;

        if (!$chatId || !$text) {
            return ['error' => 'chat_id and text required'];
        }

        $response = $this->client->sendMessage($chatId, $text);

        return ['result' => $response];
    }
}
