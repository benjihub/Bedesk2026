<?php

namespace App\Features\Whatsapp\Domain\Events;

use App\Features\Whatsapp\Domain\DTO\OutgoingMessage;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutgoingMessageFailed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public OutgoingMessage $message,
        public ?int $accountId,
        public string $reason,
    ) {
    }
}
