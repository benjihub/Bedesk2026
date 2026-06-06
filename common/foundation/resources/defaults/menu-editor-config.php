<?php

return [
    'positions' => array_filter([
        [
            'name' => 'admin-sidebar',
            'label' => 'Admin sidebar',
            'route' => '/admin',
        ],
        [
            'name' => 'custom-page-navbar',
            'label' => 'Custom page navbar',
            'route' => '/pages/f7fy8bxf0e18',
        ],
        [
            'name' => 'auth-dropdown',
            'label' => 'Auth dropdown',
            'route' => '/',
        ],
        [
            'name' => 'account-settings-page',
            'label' => 'Account settings page',
            'route' => '/account-settings',
        ],
        [
            'name' => 'contact-us-page',
            'label' => 'Contact us page',
            'route' => '/contact',
        ],
        [
            'name' => 'notifications-page',
            'label' => 'Notifications page',
            'route' => '/notifications',
        ],
        [
            'name' => 'footer',
            'label' => 'Footer',
            'route' => '/',
        ],
        [
            'name' => 'footer-secondary',
            'label' => 'Footer secondary',
            'route' => '/',
        ],
        ...settings('billing.integrated')
            ? [
                [
                    'name' => 'billing-page',
                    'label' => 'Billing page',
                    'route' => null,
                ],
                [
                    'name' => 'checkout-page-navbar',
                    'label' => 'Checkout page navbar',
                    'route' => '/checkout',
                ],
                [
                    'name' => 'pricing-table-page',
                    'label' => 'Pricing table page',
                    'route' => '/pricing',
                ],
            ]
            : [],
        config('app.has_mobile_app')
            ? [
                'name' => 'mobile-app-about',
                'label' => 'Mobile app about',
                'route' => null,
            ]
            : null,
    ]),
    'available_routes' => [
        '/',
        '/login',
        '/register',
        '/contact',
        '/account-settings',
        '/admin',
        ...settings('billing.integrated')
            ? ['/pricing', '/admin/plans', '/admin/subscriptions']
            : [],
        '/admin/users',
        '/admin/roles',
        '/admin/pages',
        '/admin/tags',
        '/admin/files',
        '/admin/localizations',
        '/admin/ads',
        '/admin/logs',
        '/admin/settings/general',
        '/admin/settings/livechat',
        '/admin/settings/authentication',
        '/admin/settings/branding',
        '/admin/settings/cache',
        '/admin/settings/providers',
        '/api-docs',
    ],
];
