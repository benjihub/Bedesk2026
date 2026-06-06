<?php

namespace Common\Websockets\API;

use Illuminate\Support\Collection;

class NullAPI extends WebsocketProviderAPI
{
    public function getAllChannels(): Collection
    {
        return collect();
    }

    public function getActiveUsersInChannel(string $channel): Collection
    {
        return collect();
    }
}
