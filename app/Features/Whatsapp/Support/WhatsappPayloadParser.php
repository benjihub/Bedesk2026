<?php

namespace App\Features\Whatsapp\Support;

use App\Features\Whatsapp\Domain\DTO\IncomingMessage;
use App\Features\Whatsapp\Domain\DTO\MessageStatusUpdate;

class WhatsappPayloadParser
{
    public function detectEventType(array $payload): string
    {
        if ($this->extractIncomingMessages($payload)) {
            return 'messages';
        }

        if ($this->extractStatusUpdates($payload)) {
            return 'statuses';
        }

        return 'unknown';
    }

    /**
     * @return IncomingMessage[]
     */
    public function extractIncomingMessages(array $payload): array
    {
        $messages = [];

        foreach ($this->extractChanges($payload) as $change) {
            $value = $change['value'] ?? [];
            $contacts = $value['contacts'][0] ?? [];
            $contactName = $contacts['profile']['name'] ?? null;
            $contactWaId = $contacts['wa_id'] ?? null;
            $metadata = $value['metadata'] ?? [];
            $to = $metadata['phone_number_id'] ?? null;

            foreach ($value['messages'] ?? [] as $message) {
                $providerMessageId = $message['id'] ?? null;
                $from = $message['from'] ?? null;
                if (!$providerMessageId || !$from) {
                    continue;
                }

                $type = $message['type'] ?? 'unknown';
                $body = null;
                if ($type === 'text') {
                    $body = $message['text']['body'] ?? null;
                }

                $messages[] = new IncomingMessage(
                    providerMessageId: $providerMessageId,
                    from: $from,
                    to: $to,
                    type: $type,
                    body: $body,
                    timestamp: $message['timestamp'] ?? null,
                    contactName: $contactName,
                    contactWaId: $contactWaId,
                    raw: $message,
                );
            }
        }

        return $messages;
    }

    /**
     * @return MessageStatusUpdate[]
     */
    public function extractStatusUpdates(array $payload): array
    {
        $updates = [];

        foreach ($this->extractChanges($payload) as $change) {
            $value = $change['value'] ?? [];
            foreach ($value['statuses'] ?? [] as $status) {
                $providerMessageId = $status['id'] ?? null;
                $statusValue = $status['status'] ?? null;
                if (!$providerMessageId || !$statusValue) {
                    continue;
                }

                $updates[] = new MessageStatusUpdate(
                    providerMessageId: $providerMessageId,
                    status: $statusValue,
                    timestamp: $status['timestamp'] ?? null,
                    recipientId: $status['recipient_id'] ?? null,
                    raw: $status,
                );
            }
        }

        return $updates;
    }

    public function extractPhoneNumberId(array $payload): ?string
    {
        foreach ($this->extractChanges($payload) as $change) {
            $value = $change['value'] ?? [];
            $metadata = $value['metadata'] ?? [];
            if (!empty($metadata['phone_number_id'])) {
                return $metadata['phone_number_id'];
            }
        }

        return null;
    }

    protected function extractChanges(array $payload): array
    {
        $changes = [];

        if (!empty($payload['field']) && array_key_exists('value', $payload)) {
            $changes[] = [
                'field' => $payload['field'],
                'value' => $payload['value'],
            ];
        }

        foreach ($payload['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                $changes[] = $change;
            }
        }

        return $changes;
    }
}
