<?php

namespace App\Features\Telegram\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use App\Features\Telegram\Application\Services\TelegramWebhookService;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function verify(Request $request): Response
    {
        return response('Telegram webhook verification stub', 200);
    }

    public function handle(Request $request): JsonResponse
    {
        Log::debug('Telegram webhook received', [
            'headers' => $request->headers->all(),
            'raw_body' => $request->getContent(),
            'ip' => $request->ip(),
        ]);

        try {
            $service = app(TelegramWebhookService::class);
            // best-effort: dispatch payload for internal processing
            $service->handle($request);
        } catch (\Throwable $e) {
            // log but do NOT return error status to Telegram
            Log::error('Telegram webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // IMPORTANT: Always return HTTP 200 and a simple empty JSON object
        // Telegram treats any 4xx/5xx as a failure and will retry or report "Wrong response"
        return response()->json((object) [], 200);
    }
}
