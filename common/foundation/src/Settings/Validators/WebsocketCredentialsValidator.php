<?php

namespace Common\Settings\Validators;

use Common\Websockets\API\WebsocketAPI;
use Illuminate\Support\Arr;
use Throwable;

class WebsocketCredentialsValidator
{
    const KEYS = [
        'broadcast_connection',

        // pusher
        'PUSHER_APP_ID',
        'PUSHER_APP_KEY',
        'PUSHER_APP_SECRET',
        'PUSHER_APP_CLUSTER',

        // reverb
        'REVERB_APP_ID',
        'REVERB_APP_KEY',
        'REVERB_APP_SECRET',
        'REVERB_HOST',
        'REVERB_PORT',
        'REVERB_SCHEME',

        // ably
        'ABLY_APP_ID',
        'ABLY_APP_KEY',
        'ABLY_APP_SECRET',
    ];

    public function fails($settings)
    {
        $this->setConfigDynamically($settings);

        $driver = Arr::get(
            $settings,
            'broadcast_connection',
            config('broadcasting.default'),
        );
        try {
            (new WebsocketAPI([
                'throw' => true,
            ]))->getAllChannels();
        } catch (Throwable $e) {
            return $this->getErrorMessage($e, $driver);
        }
    }

    private function setConfigDynamically($settings): void
    {
        foreach ($settings as $key => $value) {
            if ($key === 'broadcast_connection') {
                config(['broadcasting.default' => $value]);
                continue;
            }

            // PUSHER_API_ID => broadcasting.connections.pusher.app_id
            $parts = explode('_', $key);
            $group = array_shift($parts);
            $key = strtolower(implode('_', $parts));
            $key = str_contains($key, 'app_id')
                ? $key
                : str_replace('app_', '', $key);

            if ($key === 'cluster') {
                $prevCluster = config(
                    "broadcasting.connections.$group.options.$key",
                );
                $prevHost = config(
                    "broadcasting.connections.$group.options.host",
                );
                config([
                    "broadcasting.connections.$group.options.$key" => $value,
                    "broadcasting.connections.$group.options.host" => str_replace(
                        $prevCluster,
                        $value,
                        $prevHost,
                    ),
                ]);
            } else {
                config(["broadcasting.connections.$group.$key" => $value]);
            }
        }
    }

    private function getErrorMessage(Throwable $e, string $driver): array
    {
        return [
            'websockets_group' => "Could not change websockets driver to <strong>$driver</strong>.<br> {$e->getMessage()}",
        ];
    }
}
