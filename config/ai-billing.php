<?php

return [
    'default_plan_slug' => env('AI_BILLING_DEFAULT_PLAN', 'premium'),
    'top_up_price' => (int) env('AI_BILLING_TOP_UP_PRICE', 2000000),
    'top_up_credits' => (int) env('AI_BILLING_TOP_UP_CREDITS', 60000),
    'top_up_expiry_hours' => (int) env('AI_BILLING_TOP_UP_EXPIRY_HOURS', 24),
    'payment_request_expiry_hours' => (int) env(
        'AI_BILLING_PAYMENT_EXPIRY_HOURS',
        24,
    ),
    'crypto_asset' => env('AI_BILLING_CRYPTO_ASSET', 'USDT'),
    'crypto_network' => env('AI_BILLING_CRYPTO_NETWORK', 'TRC20'),
    'crypto_wallet_address' => env('AI_BILLING_CRYPTO_WALLET_ADDRESS', ''),
    'crypto_scanner_url' => env(
        'AI_BILLING_CRYPTO_SCANNER_URL',
        'https://tronscan.org/#/transaction/{hash}',
    ),
    'payment_provider' => env(
        'AI_BILLING_PAYMENT_PROVIDER',
        'tron_self_custody',
    ),
    'exchange_rate' => [
        'url' => env(
            'AI_BILLING_EXCHANGE_RATE_URL',
            'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr',
        ),
        'json_path' => env('AI_BILLING_EXCHANGE_RATE_JSON_PATH', 'tether.idr'),
        'direction' => env(
            'AI_BILLING_EXCHANGE_RATE_DIRECTION',
            'fiat_per_crypto',
        ),
        'timeout' => (int) env('AI_BILLING_EXCHANGE_RATE_TIMEOUT', 10),
        'decimals' => (int) env('AI_BILLING_CRYPTO_AMOUNT_DECIMALS', 8),
    ],
    'tron' => [
        'api_base_url' => env('TRON_API_BASE_URL', 'https://api.trongrid.io'),
        'api_key' => env('TRON_API_KEY', ''),
        'usdt_contract' => env(
            'TRON_USDT_CONTRACT',
            'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj',
        ),
        'usdt_contract_hex' => env('TRON_USDT_CONTRACT_HEX', ''),
        'usdt_decimals' => (int) env('TRON_USDT_DECIMALS', 6),
        'request_qr_size' => (int) env('AI_BILLING_PAYMENT_QR_SIZE', 180),
    ],
];
