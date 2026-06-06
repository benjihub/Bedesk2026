<?php

return [
    'enabled' => env('LINE_ENABLED', false),
    'channel_id' => env('LINE_CHANNEL_ID'),
    'channel_secret' => env('LINE_CHANNEL_SECRET'),
    'channel_token' => env('LINE_CHANNEL_TOKEN'),
    'webhook_secret' => env('LINE_WEBHOOK_SECRET'),
    'bridge' => env(
        'LINE_BRIDGE',
        App\Features\Line\Support\NullLineBridge::class,
    ),
    'api_base_url' => env('LINE_API_BASE_URL', 'https://api.line.me'),
    'data_api_base_url' => env('LINE_DATA_API_BASE_URL', 'https://api-data.line.me'),
    'default_account_name' => env('LINE_DEFAULT_ACCOUNT_NAME', 'Default LINE Account'),
    'verify_signatures' => env('LINE_VERIFY_SIGNATURES', true),
    'log_webhooks' => env('LINE_LOG_WEBHOOKS', true),
    'signature_header' => env('LINE_SIGNATURE_HEADER', 'X-Line-Signature'),
    'typing_seconds' => env('LINE_TYPING_SECONDS', 5),
];
