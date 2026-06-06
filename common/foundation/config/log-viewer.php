<?php

return [
    'enabled' => env('LOG_VIEWER_ENABLED', false),
    'api_only' => env('LOG_VIEWER_API_ONLY', true),
    'include_files' => [storage_path('logs/*.log')],
    'exclude_files' => ['mail.log', 'geoip.log'],
];
