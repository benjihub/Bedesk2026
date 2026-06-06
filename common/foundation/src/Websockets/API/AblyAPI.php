<?php

namespace Common\Websockets\API;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Collection;

class AblyAPI extends WebsocketProviderAPI
{
    public function getAllChannels(): Collection
    {
        $response = $this->makeAblyRequest('channels');
        return collect($response ?? []);
    }

    public function getActiveUsersInChannel(string $channel): Collection
    {
        $response = $this->makeAblyRequest(
            "channels/presence:$channel/presence",
        );

        return collect($response ?? [])
            ->map(fn($item) => json_decode($item['data'], true))
            ->unique('id');
    }

    protected function makeAblyRequest(string $path)
    {
        return $this->makeRequestWithCaching("https://rest.ably.io/$path");
    }

    protected function getClient(): PendingRequest
    {
        $parts = explode(':', config('broadcasting.connections.ably.key'));
        return parent::getClient()->withBasicAuth($parts[0], $parts[1]);
    }
}
