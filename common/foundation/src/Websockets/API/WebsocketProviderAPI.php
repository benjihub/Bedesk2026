<?php

namespace Common\Websockets\API;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

abstract class WebsocketProviderAPI
{
    protected array $cache = [];

    public function __construct(protected array $options = []) {}

    abstract public function getAllChannels(): Collection;

    abstract public function getActiveUsersInChannel(
        string $channel,
    ): Collection;

    protected function getClient(): PendingRequest
    {
        return Http::withOptions([
            'verify' => false,
        ])->throwIf($this->options['throw'] ?? false);
    }

    protected function makeRequestWithCaching(string $path, array $params = [])
    {
        $cacheKey = $path . json_encode($params);

        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }

        $response = $this->getClient()->get($path, $params)->json();

        $this->cache[$cacheKey] = $response;

        return $response;
    }
}
