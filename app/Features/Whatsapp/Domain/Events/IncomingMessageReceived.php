<?php

namespace App\Features\Whatsapp\Domain\Events;

use App\Features\Whatsapp\Domain\DTO\IncomingMessage;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncomingMessageReceived
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public IncomingMessage $message,
        public ?int $storedMessageId,
        public ?int $accountId,
    ) {
    }
}
