<?php

namespace App\Features\Telegram\Application\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Features\Telegram\Contracts\TelegramBridgeInterface;

class TelegramWebhookService
{
    protected TelegramBridgeInterface $bridge;

    public function __construct(TelegramBridgeInterface $bridge)
    {
        $this->bridge = $bridge;
    }

    /**
     * Handle incoming Telegram webhook update and dispatch to bridge.
     *
     * @return array
     */
    public function handle(Request $request): array
    {
        $payload = $request->json()->all() ?: $request->all();

        Log::info('Handling Telegram webhook', ['payload' => $payload]);

        try {
            $this->bridge->dispatch($payload);
            return ['status' => 'ok'];
        } catch (\Throwable $e) {
            Log::error('Telegram webhook dispatch failed', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);

            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }
}
