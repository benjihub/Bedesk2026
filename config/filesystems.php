<?php

return [
    // laravel
    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => public_path('storage'),
            'throw' => true,
        ],
    ],

    'upload_types' => [
        // keep default user avatars type so profile images work everywhere
        'avatars' => [
            'visibility' => 'public',
            'label' => 'User avatars',
            'description' => 'Avatars uploaded by users on the site.',
            'defaults' => [
                'prefix' => 'avatars',
                'accept' => ['image'],
                'max_file_size' => '1048576',
            ],
        ],

        // app-specific types
        'brandingImages' => [
            'visibility' => 'public',
            'label' => 'Branding images',
            'description' =>
                'All branding images uploaded by admin or agents. Including logos, campaigns and flows.',
            'defaults' => [
                'prefix' => 'branding-images',
                'accept' => ['image'],
                'max_file_size' => '3145728', //3mb
            ],
        ],
        'conversationAttachments' => [
            'visibility' => 'private',
            'dont_clean' => true,
            'label' => 'Conversation attachments',
            'description' => 'Files attached to conversation messages.',
            'defaults' => [
                'max_file_size' => '26214400', //25mb
            ],
        ],
        'articleAttachments' => [
            'visibility' => 'private',
            'label' => 'Article attachments',
            'description' => 'Files attached to help center articles.',
            'defaults' => [
                'max_file_size' => '5242880', //5mb
            ],
        ],
        'conversationImages' => [
            'visibility' => 'public',
            'label' => 'Conversation images',
            'description' => 'Inline images added to conversation messages.',
            'defaults' => [
                'prefix' => 'conversation-images',
                'accept' => ['image'],
                'max_file_size' => '2097152', //2mb
            ],
        ],

        // keep default articleImages type from foundation package
        'articleImages' => [
            'visibility' => 'public',
            'label' => 'Article images',
            'description' =>
                'Inline article and custom page images uploaded from editor.',
            'defaults' => [
                'prefix' => 'article-images',
                'accept' => ['image'],
                'max_file_size' => '3145728',
            ],
        ],
    ],

    // app
    'disable_thumbnail_creation' => env('DISABLE_THUMBNAIL_CREATION', false),
    'use_presigned_s3_urls' => env('USE_PRESIGNED_S3_URLS', true),
    'static_file_delivery' => env('STATIC_FILE_DELIVERY', null),
    'uploads_disable_tus' => env('UPLOADS_DISABLE_TUS'),
    'uploads_tus_method' => env('UPLOADS_TUS_METHOD'),

    // legacy
    'uploads_disk_driver' => env('UPLOADS_DISK_DRIVER', 'local'),
    'public_disk_driver' => env('PUBLIC_DISK_DRIVER', 'local'),
    'file_preview_endpoint' => env('FILE_PREVIEW_ENDPOINT'),
];
