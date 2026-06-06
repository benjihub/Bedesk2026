<?php

namespace App\Features\Line\Contracts;

use App\Features\Line\Domain\DTO\IncomingMessage;
use App\Features\Line\Domain\DTO\MessageStatusUpdate;

interface LineBridgeInterface
{
    public function handleIncomingMessage(IncomingMessage $message): void;

    public function handleStatusUpdate(MessageStatusUpdate $statusUpdate): void;
}
