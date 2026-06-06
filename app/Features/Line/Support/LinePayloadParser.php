<?php

namespace App\Features\Line\Support;

use App\Features\Line\Domain\DTO\IncomingMessage;
use App\Features\Line\Domain\DTO\MessageStatusUpdate;

class LinePayloadParser
{
    public function detectEventType(array $payload): string
    {
        if (!empty($payload['events'])) {
            return 'events';
        }

        return 'unknown';
    }

    /**
     * @return IncomingMessage[]
     */
    public function extractIncomingMessages(array $payload): array
    {
        $messages = [];
        foreach ($payload['events'] ?? [] as $event) {
            if (($event['type'] ?? null) !== 'message') {
                continue;
            }

            $message = $event['message'] ?? [];
            $providerMessageId = $message['id'] ?? ($event['timestamp'] ?? null);
            $from = $event['source']['userId'] ?? null;
            $to = $payload['destination'] ?? null;
            $type = $message['type'] ?? 'unknown';
            $body = match ($type) {
                'text' => $message['text'] ?? null,
                'image' => '[line image] id:' . ($message['id'] ?? 'unknown'),
                'video' => '[line video] id:' . ($message['id'] ?? 'unknown'),
                'audio' => '[line audio] id:' . ($message['id'] ?? 'unknown'),
                'file' => '[line file] id:' . ($message['id'] ?? 'unknown'),
                'location' => '[line location] ' . (($message['title'] ?? 'location') ?: 'location'),
                'sticker' => '[line sticker] package:' . ($message['packageId'] ?? 'unknown') . ' sticker:' . ($message['stickerId'] ?? 'unknown'),
                default => null,
            };

            $messages[] = new IncomingMessage(
                providerMessageId: (string) ($providerMessageId ?? ''),
                from: (string) ($from ?? ''),
                to: $to,
                type: $type,
                body: $body,
                timestamp: (string) ($event['timestamp'] ?? null),
                contactName: null,
                contactId: $from,
                raw: $event,
            );
        }

        return $messages;
    }

    /**
     * @return MessageStatusUpdate[]
     */
    public function extractStatusUpdates(array $payload): array
    {
        // LINE does not always send explicit delivery statuses in the same
        // webhook structure as WhatsApp. Provide empty implementation for now.
        return [];
    }

    public function extractChannelId(array $payload): ?string
    {
        return $payload['destination'] ?? null;
    }
}
