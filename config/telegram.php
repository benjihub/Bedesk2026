<?php

return [
    'enabled' => env('TELEGRAM_ENABLED', true),
    'bot_token' => env('TELEGRAM_BOT_TOKEN', ''),
    // Optionally supply a bridge class that implements
    // App\Features\Telegram\Contracts\TelegramBridgeInterface
    'bridge' => env('TELEGRAM_BRIDGE_CLASS', null),
];
