<?php

namespace App\Features\Line\Infrastructure\Clients;

use App\Features\Line\Contracts\LineClientInterface;
use App\Features\Line\Models\LineAccount;
use Illuminate\Support\Facades\Http;

class LineApiClient implements LineClientInterface
{
    public function sendMessage(LineAccount $account, array $payload): array
    {
        $baseUrl = rtrim(config('line.api_base_url'), '/');
        // Default to LINE push message endpoint if not specified in payload
        $url = $baseUrl . '/' . ltrim((string) ($payload['endpoint'] ?? 'v2/bot/message/push'), '/');

        $response = Http::withToken($account->channel_token)
            ->acceptJson()
            ->post($url, $payload['body'] ?? $payload);

        if ($response->failed()) {
            throw new \RuntimeException('LINE API request failed: ' . $response->body());
        }

        return $response->json() ?? [];
    }

    public function sendTypingIndicator(
        LineAccount $account,
        string $chatId,
        int $loadingSeconds,
    ): void {
        $baseUrl = rtrim((string) config('line.api_base_url', 'https://api.line.me'), '/');
        $url = $baseUrl . '/v2/bot/chat/loading/start';

        $response = Http::withToken($account->channel_token)
            ->acceptJson()
            ->post($url, [
                'chatId' => $chatId,
                'loadingSeconds' => $loadingSeconds,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('LINE typing API request failed: ' . $response->body());
        }
    }
}
