<?php

namespace App\Features\Whatsapp\Infrastructure\Clients;

use App\Features\Whatsapp\Contracts\WhatsappClientInterface;
use App\Features\Whatsapp\Models\WhatsappAccount;
use Illuminate\Support\Facades\Http;

class MetaWhatsappClient implements WhatsappClientInterface
{
    public function sendMessage(WhatsappAccount $account, array $payload): array
    {
        $baseUrl = rtrim(config('whatsapp.api_base_url'), '/');
        $url = $baseUrl . '/' . $account->phone_number_id . '/messages';

        $response = Http::withToken($account->access_token)
            ->acceptJson()
            ->post($url, $payload);

        if ($response->failed()) {
            throw new \RuntimeException(
                'WhatsApp API request failed: ' . $response->body(),
            );
        }

        return $response->json() ?? [];
    }

    public function sendTypingIndicator(
        WhatsappAccount $account,
        string $messageId,
    ): void {
        $baseUrl = rtrim(config('whatsapp.api_base_url'), '/');
        $url = $baseUrl . '/' . $account->phone_number_id . '/messages';

        $response = Http::withToken($account->access_token)
            ->acceptJson()
            ->post($url, [
                'messaging_product' => 'whatsapp',
                'status' => 'read',
                'message_id' => $messageId,
                'typing_indicator' => [
                    'type' => 'text',
                ],
            ]);

        if ($response->failed()) {
            throw new \RuntimeException(
                'WhatsApp typing API request failed: ' . $response->body(),
            );
        }
    }
}
