<?php

return [
    'enabled' => env('WHATSAPP_ENABLED', false),
    'bridge' => env(
        'WHATSAPP_BRIDGE',
        App\Features\Whatsapp\Support\NullWhatsappBridge::class,
    ),
    'verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
    'app_secret' => env('WHATSAPP_APP_SECRET'),
    'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
    'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
    'default_account_name' => env(
        'WHATSAPP_DEFAULT_ACCOUNT_NAME',
        'Default WhatsApp Account',
    ),
    'api_base_url' => env(
        'WHATSAPP_API_BASE_URL',
        'https://graph.facebook.com/v20.0',
    ),
    'verify_signatures' => env('WHATSAPP_VERIFY_SIGNATURES', true),
    'log_webhooks' => env('WHATSAPP_LOG_WEBHOOKS', true),
    'signature_header' => env(
        'WHATSAPP_SIGNATURE_HEADER',
        'X-Hub-Signature-256',
    ),
];
