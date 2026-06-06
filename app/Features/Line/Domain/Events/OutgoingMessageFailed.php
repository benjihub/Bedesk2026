<?php

namespace App\Features\Line\Domain\Events;

use App\Features\Line\Domain\DTO\OutgoingMessage;
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
