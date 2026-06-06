<?php

return [
    'log_failures' => false,
    'service' => 'maxmind_database',
    'cache_tags' => [],
    'default_location' => [
        'iso_code' => null,
        'country' => null,
        'city' => null,
        'state' => null,
        'state_name' => null,
        'postal_code' => null,
        'lat' => null,
        'lon' => null,
        'timezone' => config('app.timezone'),
        'continent' => null,
    ],
];
