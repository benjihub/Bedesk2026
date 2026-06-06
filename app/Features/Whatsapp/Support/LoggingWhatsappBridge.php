<?php

namespace App\Features\Whatsapp\Support;

use App\Features\Whatsapp\Contracts\WhatsappBridgeInterface;
use App\Features\Whatsapp\Domain\DTO\IncomingMessage;
use App\Features\Whatsapp\Domain\DTO\MessageStatusUpdate;
use Illuminate\Support\Facades\Log;

class LoggingWhatsappBridge implements WhatsappBridgeInterface
{
    public function handleIncomingMessage(IncomingMessage $message): void
    {
        Log::info('WhatsApp bridge received message', [
            'provider_message_id' => $message->providerMessageId,
            'from' => $message->from,
            'to' => $message->to,
            'type' => $message->type,
            'body' => $message->body,
        ]);
    }

    public function handleStatusUpdate(MessageStatusUpdate $statusUpdate): void
    {
        Log::info('WhatsApp bridge status update', [
            'provider_message_id' => $statusUpdate->providerMessageId,
            'status' => $statusUpdate->status,
            'recipient_id' => $statusUpdate->recipientId,
            'timestamp' => $statusUpdate->timestamp,
        ]);
    }
}
