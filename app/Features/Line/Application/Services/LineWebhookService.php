<?php

namespace App\Features\Line\Application\Services;

use App\Features\Line\Domain\Events\IncomingMessageReceived;
use App\Features\Line\Domain\Events\MessageDeliveryStatusUpdated;
use App\Features\Line\Models\LineWebhookEvent;
use App\Features\Line\Support\WebhookSignatureValidator;
use App\Features\Line\Support\LinePayloadParser;
use Illuminate\Http\Request;

class LineWebhookService
{
    public function __construct(
        protected WebhookSignatureValidator $signatureValidator,
        protected LinePayloadParser $payloadParser,
        protected LineMessageService $messageService,
        protected LineAccountResolver $accountResolver,
    ) {
    }

    /**
     * @return array{accepted: bool, signature_valid: bool}
     */
    public function handle(Request $request): array
    {
        $rawPayload = $request->getContent();
        $signature = $request->header(config('line.signature_header'));
        $signatureValid = $this->signatureValidator->isValid($rawPayload, $signature);

        if (config('line.verify_signatures') && !$signatureValid) {
            $this->logEvent($request, null, $signatureValid, 'invalid');
            return [
                'accepted' => false,
                'signature_valid' => false,
            ];
        }

        $payload = $request->json()->all();
        $channelId = $this->payloadParser->extractChannelId($payload);
        $account = $this->accountResolver->resolveByChannelId($channelId);

        $eventType = $this->payloadParser->detectEventType($payload);
        $this->logEvent($request, $account?->id, $signatureValid, $eventType);

        $incomingMessages = $this->payloadParser->extractIncomingMessages($payload);
        foreach ($incomingMessages as $incomingMessage) {
            $record = $this->messageService->storeIncomingMessage($incomingMessage, $account);
            event(new IncomingMessageReceived($incomingMessage, $record->id, $account?->id));
        }

        $statusUpdates = $this->payloadParser->extractStatusUpdates($payload);
        foreach ($statusUpdates as $statusUpdate) {
            $record = $this->messageService->applyStatusUpdate($statusUpdate);
            event(new MessageDeliveryStatusUpdated($statusUpdate, $record?->id, $account?->id));
        }

        return [
            'accepted' => true,
            'signature_valid' => $signatureValid,
        ];
    }

    protected function logEvent(Request $request, ?int $accountId, bool $signatureValid, ?string $eventType): void
    {
        if (!config('line.log_webhooks')) {
            return;
        }

        LineWebhookEvent::create([
            'account_id' => $accountId,
            'event_type' => $eventType,
            'signature_valid' => $signatureValid,
            'headers' => $request->headers->all(),
            'payload' => $request->json()->all(),
            'received_at' => now(),
        ]);
    }
}
