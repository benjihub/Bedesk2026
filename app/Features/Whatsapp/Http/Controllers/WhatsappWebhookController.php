<?php

namespace App\Features\Whatsapp\Http\Controllers;

use App\Features\Whatsapp\Application\Services\WhatsappWebhookService;
use Common\Core\BaseController;
use Illuminate\Http\Request;

class WhatsappWebhookController extends BaseController
{
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode') ?? $request->query('hub.mode');
        $token = $request->query('hub_verify_token') ??
            $request->query('hub.verify_token');
        $challenge = $request->query('hub_challenge') ??
            $request->query('hub.challenge');

        $expected = config('whatsapp.verify_token');

        if (
            $mode === 'subscribe' &&
            $expected &&
            $token &&
            hash_equals($expected, $token)
        ) {
            return response((string) $challenge, 200);
        }

        // Return plain text 403 (no JSON) so Meta/WhatsApp accepts the failure response format.
        return response('Forbidden', 403);
    }

    public function handle(Request $request, WhatsappWebhookService $service)
    {
        $result = $service->handle($request);
        if (!$result['accepted']) {
            // Only enforce signature validation in production when configured.
            if (app()->environment('production') && config('whatsapp.verify_signatures')) {
                return response()->json(['message' => 'Invalid signature.'], 401);
            }

            // In non-production environments, log and continue for easier local testing.
            \Log::warning('Whatsapp webhook signature invalid but bypassed (non-production).', [
                'signature_valid' => $result['signature_valid'],
                'ip' => $request->ip(),
            ]);
        }

        return $this->success([
            'received' => true,
            'signature_valid' => $result['signature_valid'],
        ]);
    }
}
