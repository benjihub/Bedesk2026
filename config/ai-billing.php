<?php

$nowPaymentsApiBaseUrl = env(
    'NOWPAYMENTS_API_BASE_URL',
    'https://api.nowpayments.io/v1',
);

$nowPaymentsCheckoutUrlTemplate = str_contains(
    strtolower((string) $nowPaymentsApiBaseUrl),
    'sandbox',
)
    ? 'https://sandbox.nowpayments.io/payment/?iid={id}'
    : 'https://nowpayments.io/payment/?iid={id}';

return [
    'default_plan_slug' => env('AI_BILLING_DEFAULT_PLAN', 'premium'),
    'top_up_price' => (int) env('AI_BILLING_TOP_UP_PRICE', 2000000),
    'top_up_credits' => (int) env('AI_BILLING_TOP_UP_CREDITS', 60000),
    'top_up_expiry_hours' => (int) env('AI_BILLING_TOP_UP_EXPIRY_HOURS', 24),
    'payment_request_expiry_hours' => (int) env(
        'AI_BILLING_PAYMENT_EXPIRY_HOURS',
        24,
    ),
    'payment_reconcile_limit' => (int) env('AI_BILLING_RECONCILE_LIMIT', 50),
    'crypto_asset' => env('AI_BILLING_CRYPTO_ASSET', 'USDT'),
    'crypto_network' => env('AI_BILLING_CRYPTO_NETWORK', 'TRC20'),
    'crypto_wallet_address' => env('AI_BILLING_CRYPTO_WALLET_ADDRESS', ''),
    'crypto_scanner_url' => env(
        'AI_BILLING_CRYPTO_SCANNER_URL',
        'https://tronscan.org/#/transaction/{hash}',
    ),
    'payment_provider' => env(
        'AI_BILLING_PAYMENT_PROVIDER',
        'nowpayments',
    ),
    'nowpayments' => [
        'api_base_url' => $nowPaymentsApiBaseUrl,
        'api_key' => env('NOWPAYMENTS_API_KEY', ''),
        'ipn_secret' => env('NOWPAYMENTS_IPN_SECRET', ''),
        'ipn_callback_url' => env('NOWPAYMENTS_IPN_CALLBACK_URL', ''),
        'success_url' => env('NOWPAYMENTS_SUCCESS_URL', ''),
        'cancel_url' => env('NOWPAYMENTS_CANCEL_URL', ''),
        'price_currency' => env('NOWPAYMENTS_PRICE_CURRENCY', 'USDTTRC20'),
        'pay_currency' => env('NOWPAYMENTS_PAY_CURRENCY', 'USDTTRC20'),
        'checkout_url_template' => env(
            'NOWPAYMENTS_CHECKOUT_URL_TEMPLATE',
            $nowPaymentsCheckoutUrlTemplate,
        ),
        'timeout' => (int) env('NOWPAYMENTS_TIMEOUT', 30),
    ],
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
        'scan_limit' => (int) env('AI_BILLING_TRON_SCAN_LIMIT', 200),
        'scan_pending_limit' => (int) env(
            'AI_BILLING_TRON_SCAN_PENDING_LIMIT',
            50,
        ),
        'request_qr_size' => (int) env('AI_BILLING_PAYMENT_QR_SIZE', 180),
    ],
];
