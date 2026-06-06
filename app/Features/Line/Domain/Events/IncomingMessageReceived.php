<?php

namespace App\Features\Line\Domain\Events;

use App\Features\Line\Domain\DTO\IncomingMessage;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncomingMessageReceived
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public IncomingMessage $incoming,
        public int $storedMessageId,
        public ?int $accountId,
    ) {
    }
}
