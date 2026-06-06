<?php

namespace App\Features\Whatsapp\Domain\Events;

use App\Features\Whatsapp\Domain\DTO\MessageStatusUpdate;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeliveryStatusUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public MessageStatusUpdate $statusUpdate,
        public ?int $storedMessageId,
        public ?int $accountId,
    ) {
    }
}
