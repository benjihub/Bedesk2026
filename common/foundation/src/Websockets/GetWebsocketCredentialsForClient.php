<?php

namespace Common\Websockets;

class GetWebsocketCredentialsForClient
{
    public function execute(): array|null
    {
        $driver = config('broadcasting.default');

        if ($driver === 'pusher') {
            return [
                'driver' => 'pusher',
                'key' => config('broadcasting.connections.pusher.key'),
                'cluster' => config(
                    'broadcasting.connections.pusher.options.cluster',
                ),
            ];
        } elseif ($driver === 'reverb') {
            return [
                'driver' => 'reverb',
                'key' => config('broadcasting.connections.reverb.key'),
                'host' => config(
                    'broadcasting.connections.reverb.options.host',
                ),
                'port' => config(
                    'broadcasting.connections.reverb.options.port',
                ),
                'scheme' => config(
                    'broadcasting.connections.reverb.options.scheme',
                ),
            ];
        } elseif ($driver === 'ably') {
            return [
                'driver' => 'ably',
                'key' => explode(
                    ':',
                    config('broadcasting.connections.ably.key'),
                )[0],
            ];
        }

        return null;
    }
}
