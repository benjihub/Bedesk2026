<?php

namespace App\Features\Whatsapp\Domain\Events;

use App\Features\Whatsapp\Domain\DTO\OutgoingMessage;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutgoingMessageSent
{
    use Dispatchable, SerializesModels;

    /**
     * @param array<string, mixed> $providerResponse
     */
    public function __construct(
        public OutgoingMessage $message,
        public ?int $storedMessageId,
        public ?int $accountId,
        public array $providerResponse,
    ) {
    }
}
