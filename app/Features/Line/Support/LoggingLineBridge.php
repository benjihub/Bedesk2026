<?php

namespace App\Features\Line\Support;

use App\Features\Line\Contracts\LineBridgeInterface;
use App\Features\Line\Domain\DTO\IncomingMessage;
use App\Features\Line\Domain\DTO\MessageStatusUpdate;
use Illuminate\Support\Facades\Log;

class LoggingLineBridge implements LineBridgeInterface
{
    public function handleIncomingMessage(IncomingMessage $message): void
    {
        Log::info('LINE bridge received message', [
            'provider_message_id' => $message->providerMessageId,
            'from' => $message->from,
            'to' => $message->to,
            'type' => $message->type,
            'body' => $message->body,
        ]);
    }

    public function handleStatusUpdate(MessageStatusUpdate $statusUpdate): void
    {
        Log::info('LINE bridge status update', [
            'provider_message_id' => $statusUpdate->providerMessageId,
            'status' => $statusUpdate->status,
            'recipient_id' => $statusUpdate->recipientId,
            'timestamp' => $statusUpdate->timestamp,
        ]);
    }
}
