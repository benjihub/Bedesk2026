<?php

namespace App\Features\Line\Application\Services;

use App\Features\Line\Contracts\LineBridgeInterface;
use App\Features\Line\Contracts\LineClientInterface;
use App\Features\Line\Domain\DTO\IncomingMessage;
use App\Features\Line\Domain\DTO\MessageStatusUpdate;
use App\Features\Line\Domain\DTO\OutgoingMessage;
use App\Features\Line\Domain\Events\OutgoingMessageFailed;
use App\Features\Line\Domain\Events\OutgoingMessageSent;
use App\Features\Line\Models\LineAccount;
use App\Features\Line\Models\LineContact;
use App\Features\Line\Models\LineMessage;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class LineMessageService
{
    public function __construct(
        protected LineClientInterface $client,
        protected LineBridgeInterface $bridge,
        protected LineAccountResolver $accountResolver,
    ) {
    }

    public function storeIncomingMessage(IncomingMessage $incomingMessage, ?LineAccount $account): LineMessage
    {
        $contact = $this->resolveContact($incomingMessage, $account);

        $message = LineMessage::create([
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
            'provider_timestamp' => $incomingMessage->timestamp ? (int) $incomingMessage->timestamp : null,
            'payload' => $incomingMessage->raw,
        ]);

        $this->bridge->handleIncomingMessage($incomingMessage);

        return $message;
    }

    public function applyStatusUpdate(MessageStatusUpdate $statusUpdate): ?LineMessage
    {
        $message = LineMessage::where(
            'provider_message_id',
            $statusUpdate->providerMessageId,
        )->first();

        if ($message) {
            $message->update([
                'status' => $statusUpdate->status,
                'provider_timestamp' => $statusUpdate->timestamp ? (int) $statusUpdate->timestamp : null,
            ]);
        }

        $this->bridge->handleStatusUpdate($statusUpdate);

        return $message;
    }

    public function sendMessage(OutgoingMessage $message): LineMessage
    {
        $account = $this->accountResolver->resolve($message->accountId);
        if (!$account) {
            event(new OutgoingMessageFailed($message, null, 'Account not configured'));
            throw new \RuntimeException('LINE account not configured.');
        }

        $payload = $this->buildOutgoingPayload($message);

        try {
            $response = $this->client->sendMessage($account, $payload);
        } catch (\Throwable $e) {
            event(new OutgoingMessageFailed($message, $account->id, $e->getMessage()));
            throw $e;
        }

        $providerMessageId = Arr::get($response, 'messageId') ?? Arr::get($response, 'messages.0.id');

        $record = LineMessage::create([
            'uuid' => (string) Str::uuid(),
            'account_id' => $account->id,
            'direction' => 'outgoing',
            'provider_message_id' => $providerMessageId,
            'from' => $account->channel_id,
            'to' => $message->to,
            'type' => $message->type,
            'body' => $message->body,
            'status' => 'sent',
            'payload' => [
                'request' => $payload,
                'response' => $response,
            ],
        ]);

        event(new OutgoingMessageSent($message, $record->id, $account->id, $response));

        return $record;
    }

    public function sendTypingIndicator(
        string $to,
        ?int $accountId,
        int $loadingSeconds = 5,
    ): void {
        $account = $this->accountResolver->resolve($accountId);
        if (!$account) {
            throw new \RuntimeException('LINE account not configured.');
        }

        $seconds = max(5, min(60, $loadingSeconds));
        $this->client->sendTypingIndicator($account, $to, $seconds);
    }

    protected function resolveContact(IncomingMessage $incomingMessage, ?LineAccount $account): ?LineContact
    {
        $uid = $incomingMessage->contactId ?? $incomingMessage->from;
        if (!$uid) {
            return null;
        }

        return LineContact::updateOrCreate(
            [
                'account_id' => $account?->id,
                'external_id' => $uid,
            ],
            [
                'display_name' => $incomingMessage->contactName,
            ],
        );
    }

    protected function buildOutgoingPayload(OutgoingMessage $message): array
    {
        if (!in_array($message->type, ['text', 'image'], true)) {
            throw new \InvalidArgumentException('Only text and image messages are supported.');
        }

        $messageBody = $message->type === 'image'
            ? [
                'type' => 'image',
                'originalContentUrl' => $message->originalContentUrl,
                'previewImageUrl' => $message->previewImageUrl,
            ]
            : [
                'type' => 'text',
                'text' => $message->body,
            ];

        return [
            'endpoint' => 'v2/bot/message/push',
            'body' => [
                'to' => $message->to,
                'messages' => [
                    $messageBody,
                ],
            ],
        ];
    }
}
