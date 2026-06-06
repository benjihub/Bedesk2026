<?php

namespace App\Features\Whatsapp\Contracts;

use App\Features\Whatsapp\Domain\DTO\IncomingMessage;
use App\Features\Whatsapp\Domain\DTO\MessageStatusUpdate;

interface WhatsappBridgeInterface
{
    public function handleIncomingMessage(IncomingMessage $message): void;

    public function handleStatusUpdate(MessageStatusUpdate $statusUpdate): void;
}
