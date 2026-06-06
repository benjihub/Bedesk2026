<?php

namespace App\Features\Line\Domain\Events;

use App\Features\Line\Domain\DTO\OutgoingMessage;
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
