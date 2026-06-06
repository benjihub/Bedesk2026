<?php

namespace Common\Settings\Manager;

use Illuminate\Support\Arr;

class RedactSensitiveSettings
{
    protected $serverKeys = [
        'google_id',
        'google_secret',
        'twitter_id',
        'twitter_secret',
        'facebook_id',
        'facebook_secret',
        'spotify_id',
        'spotify_secret',
        'lastfm_api_key',
        'soundcloud_api_key',
        'mailgun_secret',
        'sentry_dsn',
        'paypal_client_id',
        'paypal_secret',
        'paypal_webhook_id',
        'redis_password',
        'pusher_key',
        'pusher_secret',
        'ably_key',
        'stripe_key',
        'stripe_secret',
        'mail_password',
        'tmdb_api_key',
        'storage_digitalocean_key',
        'storage_digitalocean_secret',
        'stripe_webhook_secret',
        'openai_api_key',
        'demo_admin_password',
        'db_password',
        'envato_personal_token',
        'envato_secret',
    ];

    protected $clientKeys = [
        'youtube_api_key',
        'logging.sentry_public',
        'analytics.google_id',
        'builder.google_fonts_api_key',
        'captcha.g_site_key',
        'captcha.g_secret_key',
        'captcha.t_site_key',
        'captcha.t_secret_key',
    ];

    public function execute(array $settings): array
    {
        foreach ($this->serverKeys as $key) {
            if (isset($settings['server'][$key])) {
                $settings['server'][$key] = '***********';
            }
        }

        foreach ($this->clientKeys as $key) {
            if (isset($settings['client'][$key])) {
                $settings['client'][$key] = '***********';
            }
        }

        if (isset($settings['client']['uploading'])) {
            $uploading = json_decode(
                json_encode($settings['client']['uploading']),
                true,
            );
            $uploading['backends'] = array_map(function ($backend) {
                if (isset($backend['config'])) {
                    $backend['config'] = Arr::mapWithKeys(
                        $backend['config'],
                        function ($value, $key) {
                            if ($key == 'key' || $key == 'secret') {
                                return [$key => '***********'];
                            }
                            return [$key => $value];
                        },
                    );
                }
                return $backend;
            }, $uploading['backends']);
            $settings['client']['uploading'] = $uploading;
        }

        return $settings;
    }
}
