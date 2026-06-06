<?php

namespace App\Features\Whatsapp\Support;

use App\Features\Whatsapp\Contracts\WhatsappBridgeInterface;
use App\Features\Whatsapp\Domain\DTO\IncomingMessage;
use App\Features\Whatsapp\Domain\DTO\MessageStatusUpdate;

class NullWhatsappBridge implements WhatsappBridgeInterface
{
    public function handleIncomingMessage(IncomingMessage $message): void
    {
    }

    public function handleStatusUpdate(MessageStatusUpdate $statusUpdate): void
    {
    }
}
