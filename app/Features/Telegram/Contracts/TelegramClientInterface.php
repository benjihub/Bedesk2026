<?php

namespace App\Features\Telegram\Contracts;

interface TelegramClientInterface
{
    public function sendMessage(string $chatId, string $text): array;

    public function sendTypingIndicator(string $chatId): array;
}
