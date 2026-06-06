<?php

namespace App\Features\Whatsapp\Application\Services;

use App\Features\Whatsapp\Contracts\WhatsappBridgeInterface;
use App\Features\Whatsapp\Contracts\WhatsappClientInterface;
use App\Features\Whatsapp\Domain\DTO\IncomingMessage;
use App\Features\Whatsapp\Domain\DTO\MessageStatusUpdate;
use App\Features\Whatsapp\Domain\DTO\OutgoingMessage;
use App\Features\Whatsapp\Domain\Events\OutgoingMessageFailed;
use App\Features\Whatsapp\Domain\Events\OutgoingMessageSent;
use App\Features\Whatsapp\Models\WhatsappAccount;
use App\Features\Whatsapp\Models\WhatsappContact;
use App\Features\Whatsapp\Models\WhatsappMessage;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class WhatsappMessageService
{
    public function __construct(
        protected WhatsappClientInterface $client,
        protected WhatsappBridgeInterface $bridge,
        protected WhatsappAccountResolver $accountResolver,
    ) {
    }

    public function storeIncomingMessage(
        IncomingMessage $incomingMessage,
        ?WhatsappAccount $account,
    ): WhatsappMessage {
        $contact = $this->resolveContact($incomingMessage, $account);

        $message = WhatsappMessage::create([
            'uuid' => (string) Str::uuid(),
            'account_id' => $account?->id,
            'contact_id' => $contact?->id,
            'direction' => 'incoming',
            'provider_message_id' => $incomingMessage->providerMessageId,
            'from' => $incomingMessage->from,
            'to' => $incomingMessage->to,
            'type' => $incomingMessage->type,
            'body' => $incomingMessage->body,
            'status' => 'received',
            'provider_timestamp' => $incomingMessage->timestamp,
            'payload' => $incomingMessage->raw,
        ]);

        $this->bridge->handleIncomingMessage($incomingMessage);

        return $message;
    }

    public function applyStatusUpdate(
        MessageStatusUpdate $statusUpdate,
    ): ?WhatsappMessage {
        $message = WhatsappMessage::where(
            'provider_message_id',
            $statusUpdate->providerMessageId,
        )->first();

        if ($message) {
            $message->update([
                'status' => $statusUpdate->status,
                'provider_timestamp' => $statusUpdate->timestamp,
            ]);
        }

        $this->bridge->handleStatusUpdate($statusUpdate);

        return $message;
    }

    public function sendMessage(OutgoingMessage $message): WhatsappMessage
    {
        $account = $this->accountResolver->resolve($message->accountId);
        if (!$account) {
            event(new OutgoingMessageFailed($message, null, 'Account not configured'));
            throw new \RuntimeException('WhatsApp account not configured.');
        }

        $payload = $this->buildOutgoingPayload($message);

        try {
            $response = $this->client->sendMessage($account, $payload);
        } catch (\Throwable $e) {
            event(new OutgoingMessageFailed($message, $account->id, $e->getMessage()));
            throw $e;
        }

        $providerMessageId = Arr::get($response, 'messages.0.id');

        $record = WhatsappMessage::create([
            'uuid' => (string) Str::uuid(),
            'account_id' => $account->id,
            'direction' => 'outgoing',
            'provider_message_id' => $providerMessageId,
            'from' => $account->phone_number_id,
            'to' => $message->to,
            'type' => $message->type,
            'body' => $message->body,
            'status' => 'sent',
            'payload' => [
                'request' => $payload,
                'response' => $response,
            ],
        ]);

        event(
            new OutgoingMessageSent(
                $message,
                $record->id,
                $account->id,
                $response,
            ),
        );

        return $record;
    }

    public function sendTypingIndicator(
        string $messageId,
        ?int $accountId,
    ): void {
        $account = $this->accountResolver->resolve($accountId);
        if (!$account) {
            throw new \RuntimeException('WhatsApp account not configured.');
        }

        $this->client->sendTypingIndicator($account, $messageId);
    }

    protected function resolveContact(
        IncomingMessage $incomingMessage,
        ?WhatsappAccount $account,
    ): ?WhatsappContact {
        $waId = $incomingMessage->contactWaId ?? $incomingMessage->from;
        if (!$waId) {
            return null;
        }

        return WhatsappContact::updateOrCreate(
            [
                'account_id' => $account?->id,
                'wa_id' => $waId,
            ],
            [
                'name' => $incomingMessage->contactName,
                'phone' => $incomingMessage->from,
            ],
        );
    }

    protected function buildOutgoingPayload(OutgoingMessage $message): array
    {
        if ($message->type !== 'text') {
            throw new \InvalidArgumentException('Only text messages are supported.');
        }

        return [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $message->to,
            'type' => 'text',
            'text' => [
                'preview_url' => $message->previewUrl,
                'body' => $message->body,
            ],
        ];
    }
}
