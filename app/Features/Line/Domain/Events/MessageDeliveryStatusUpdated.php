<?php

namespace App\Features\Line\Domain\Events;

use App\Features\Line\Domain\DTO\MessageStatusUpdate;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeliveryStatusUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public MessageStatusUpdate $update,
        public ?int $storedMessageId,
        public ?int $accountId,
    ) {
    }
}
