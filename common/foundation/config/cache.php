<?php

use Illuminate\Support\Str;

return [
    // Which cache store should be used by default. This is controlled via
    // the `CACHE_STORE` (or `CACHE_DRIVER`) env variable.
    'default' => env('CACHE_STORE', 'file'),

    // Available cache stores. We keep `file` for compatibility and add a
    // dedicated `redis` store that can be enabled in production by setting
    // `CACHE_STORE=redis` in the .env file.
    'stores' => [
        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
        ],
    ],

    // Prefix used for all cache keys so multiple apps can share the same
    // cache server without key collisions.
    'prefix' => env(
        'CACHE_PREFIX',
        Str::slug(env('APP_NAME', 'laravel'), '_') . '_cache',
    ),
];
