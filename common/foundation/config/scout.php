<?php

return [
    'scout_mysql_mode' => env('SCOUT_MYSQL_MODE', 'extended'),
    'disable_scout_auto_sync' => env('DISABLE_SCOUT_AUTO_SYNC', false),

    'meilisearch' => [
        'host' => env('MEILISEARCH_HOST', 'http://localhost:7700'),
        'key' => env('MEILISEARCH_KEY', null),
    ],
];
