<?php

namespace App\Features\Whatsapp\Contracts;

use App\Features\Whatsapp\Models\WhatsappAccount;

interface WhatsappClientInterface
{
    /**
     * @return array<string, mixed>
     */
    public function sendMessage(WhatsappAccount $account, array $payload): array;

    public function sendTypingIndicator(
        WhatsappAccount $account,
        string $messageId,
    ): void;
}
