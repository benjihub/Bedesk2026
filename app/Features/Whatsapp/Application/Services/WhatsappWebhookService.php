<?php

namespace App\Features\Whatsapp\Application\Services;

use App\Features\Whatsapp\Domain\Events\IncomingMessageReceived;
use App\Features\Whatsapp\Domain\Events\MessageDeliveryStatusUpdated;
use App\Features\Whatsapp\Models\WhatsappWebhookEvent;
use App\Features\Whatsapp\Support\WebhookSignatureValidator;
use App\Features\Whatsapp\Support\WhatsappPayloadParser;
use Illuminate\Http\Request;

class WhatsappWebhookService
{
    public function __construct(
        protected WebhookSignatureValidator $signatureValidator,
        protected WhatsappPayloadParser $payloadParser,
        protected WhatsappMessageService $messageService,
        protected WhatsappAccountResolver $accountResolver,
    ) {
    }

    /**
     * @return array{accepted: bool, signature_valid: bool}
     */
    public function handle(Request $request): array
    {
        $rawPayload = $request->getContent();
        $signature = $request->header(config('whatsapp.signature_header'));
        $signatureValid = $this->signatureValidator->isValid(
            $rawPayload,
            $signature,
        );

        // Only enforce signature validation when enabled AND running in production.
        if (config('whatsapp.verify_signatures') && app()->environment('production') && !$signatureValid) {
            $this->logEvent($request, null, $signatureValid, 'invalid');
            return [
                'accepted' => false,
                'signature_valid' => false,
            ];
        }

        $payload = $request->json()->all();
        $phoneNumberId = $this->payloadParser->extractPhoneNumberId($payload);
        $account = $this->accountResolver->resolveByPhoneNumberId(
            $phoneNumberId,
        );

        $eventType = $this->payloadParser->detectEventType($payload);
        $this->logEvent($request, $account?->id, $signatureValid, $eventType);

        $incomingMessages = $this->payloadParser->extractIncomingMessages(
            $payload,
        );
        foreach ($incomingMessages as $incomingMessage) {
            $record = $this->messageService->storeIncomingMessage(
                $incomingMessage,
                $account,
            );
            event(
                new IncomingMessageReceived(
                    $incomingMessage,
                    $record->id,
                    $account?->id,
                ),
            );
        }

        $statusUpdates = $this->payloadParser->extractStatusUpdates($payload);
        foreach ($statusUpdates as $statusUpdate) {
            $record = $this->messageService->applyStatusUpdate($statusUpdate);
            event(
                new MessageDeliveryStatusUpdated(
                    $statusUpdate,
                    $record?->id,
                    $account?->id,
                ),
            );
        }

        return [
            'accepted' => true,
            'signature_valid' => $signatureValid,
        ];
    }

    protected function logEvent(
        Request $request,
        ?int $accountId,
        bool $signatureValid,
        ?string $eventType,
    ): void {
        if (!config('whatsapp.log_webhooks')) {
            return;
        }

        WhatsappWebhookEvent::create([
            'account_id' => $accountId,
            'event_type' => $eventType,
            'signature_valid' => $signatureValid,
            'headers' => $request->headers->all(),
            'payload' => $request->json()->all(),
            'received_at' => now(),
        ]);
    }
}
