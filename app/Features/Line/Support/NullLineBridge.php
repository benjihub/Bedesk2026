<?php

namespace App\Features\Line\Support;

use App\Features\Line\Contracts\LineBridgeInterface;
use App\Features\Line\Domain\DTO\IncomingMessage;
use App\Features\Line\Domain\DTO\MessageStatusUpdate;

class NullLineBridge implements LineBridgeInterface
{
    public function handleIncomingMessage(IncomingMessage $message): void
    {
    }

    public function handleStatusUpdate(MessageStatusUpdate $statusUpdate): void
    {
    }
}
