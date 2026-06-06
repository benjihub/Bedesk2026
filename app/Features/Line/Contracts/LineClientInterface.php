<?php

namespace App\Features\Line\Contracts;

use App\Features\Line\Models\LineAccount;

interface LineClientInterface
{
    /**
     * @return array<string, mixed>
     */
    public function sendMessage(LineAccount $account, array $payload): array;

    public function sendTypingIndicator(
        LineAccount $account,
        string $chatId,
        int $loadingSeconds,
    ): void;
}
