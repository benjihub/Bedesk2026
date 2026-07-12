<?php

return [
    //branding
    ['name' => 'branding.site_name', 'value' => 'BeDesk'],

    // logos
    [
        'name' => 'branding.logo_dark',
        'value' => 'images/logo-dark.png',
    ],
    [
        'name' => 'branding.logo_dark_mobile',
        'value' => 'images/logo-dark-mobile.png',
    ],
    [
        'name' => 'branding.logo_light',
        'value' => 'images/logo-light.png',
    ],
    [
        'name' => 'branding.logo_light_mobile',
        'value' => 'images/logo-light-mobile.png',
    ],
    [
        'name' => 'homepage.type',
        'value' => 'landingPage',
    ],

    //cache
    ['name' => 'cache.report_minutes', 'value' => 60],

    // menus
    [
        'name' => 'menus',
        'value' => json_encode([
            [
                'name' => 'Admin Sidebar',
                'id' => '2d43u1',
                'positions' => ['admin-sidebar'],
                'items' => [
                    [
                        'label' => 'Settings',
                        'id' => 'x5k484',
                        'action' => '/admin/settings',
                        'type' => 'route',
                        'permissions' => ['settings.update'],
                    ],
                    [
                        'label' => 'Reports',
                        'id' => '886nz4',
                        'action' => '/admin/reports/tickets',
                        'type' => 'route',
                        'permissions' => ['reports.view'],
                    ],
                    [
                        'label' => 'Triggers',
                        'action' => '/admin/triggers',
                        'type' => 'route',
                        'id' => 'mwdkz1',
                        'permissions' => ['triggers.update'],
                    ],
                    [
                        'label' => 'Views',
                        'action' => '/admin/views',
                        'type' => 'route',
                        'id' => 'mwbvz6',
                        'permissions' => ['views.update'],
                    ],
                    [
                        'label' => 'Statuses',
                        'action' => '/admin/statuses',
                        'type' => 'route',
                        'id' => 'mtbvz1',
                        'permissions' => ['statuses.update'],
                    ],
                    [
                        'label' => 'Attributes',
                        'action' => '/admin/attributes',
                        'type' => 'route',
                        'id' => 'mwdvz1',
                        'permissions' => ['attributes.update'],
                    ],
                    [
                        'id' => '5eGJwT',
                        'label' => 'Help center',
                        'permissions' => ['articles.update'],
                        'action' => '/admin/hc/arrange',
                        'type' => 'route',
                    ],
                    [
                        'label' => 'Team',
                        'action' => '/admin/team',
                        'type' => 'route',
                        'id' => 'fzfb45',
                        'permissions' => ['agents.update'],
                    ],
                    [
                        'label' => 'Customers',
                        'action' => '/admin/customers',
                        'type' => 'route',
                        'id' => 'fzfc41',
                        'permissions' => ['users.update'],
                    ],
                    [
                        'label' => 'Roles',
                        'action' => '/admin/roles',
                        'type' => 'route',
                        'id' => 'mwdkf0',
                        'permissions' => ['roles.update'],
                    ],
                    [
                        'id' => '5eGxwT',
                        'label' => 'Saved replies',
                        'permissions' => ['canned_replies.update'],
                        'action' => '/admin/saved-replies',
                        'type' => 'route',
                    ],
                    [
                        'label' => 'AI Agent',
                        'action' => '/admin/ai-agent',
                        'type' => 'route',
                        'id' => 'aiadm1',
                        'permissions' => ['ai_agent.update'],
                    ],
                    [
                        'label' => 'Billing',
                        'action' => '/admin/billing',
                        'type' => 'route',
                        'id' => 'billadm1',
                        'permissions' => ['admin'],
                    ],
                    [
                        'label' => 'Tags',
                        'action' => '/admin/tags',
                        'type' => 'route',
                        'id' => '2x0pzqx',
                        'permissions' => ['tags.update'],
                    ],
                    [
                        'label' => 'Translations',
                        'action' => '/admin/localizations',
                        'type' => 'route',
                        'id' => 'w91yql',
                        'permissions' => ['localizations.update'],
                    ],
                    [
                        'label' => 'Files',
                        'action' => '/admin/files',
                        'type' => 'route',
                        'id' => 'vguvti',
                        'permissions' => ['files.update'],
                    ],
                    [
                        'label' => 'Pages',
                        'action' => '/admin/custom-pages',
                        'type' => 'route',
                        'id' => '63bwv9',
                        'permissions' => ['custom_pages.update'],
                    ],
                    [
                        'label' => 'Logs',
                        'action' => '/admin/logs',
                        'type' => 'route',
                        'id' => '8j435f',
                        'permissions' => ['reports.view'],
                    ],
                ],
            ],

            [
                'name' => 'Dashboard sidebar',
                'id' => '2d13v1',
                'positions' => ['dashboard-sidebar'],
                'items' => [
                    [
                        'label' => 'Dashboard',
                        'id' => 'dashov1',
                        'action' => '/dashboard/overview',
                        'type' => 'route',
                        'permissions' => ['conversations.update'],
                    ],
                    [
                        'label' => 'Livechat',
                        'id' => 'x5k480',
                        'action' => '/dashboard/conversations?viewId=mine',
                        'type' => 'route',
                        'permissions' => ['conversations.update'],
                    ],
                    [
                        'label' => 'Widget',
                        'id' => 'lcadmin1',
                        'action' => '/dashboard/livechat',
                        'type' => 'route',
                        'permissions' => ['livechat.update'],
                    ],
                    [
                        'label' => 'Team',
                        'action' => '/dashboard/team',
                        'type' => 'route',
                        'id' => 'fzfb41',
                        'permissions' => ['agents.update'],
                    ],
                    [
                        'label' => 'Customers',
                        'action' => '/dashboard/customers',
                        'type' => 'route',
                        'id' => 'f6fc41',
                        'permissions' => ['users.update'],
                    ],
                    [
                        'id' => '5zGJwT',
                        'label' => 'Help center',
                        'permissions' => ['articles.update'],
                        'action' => '/dashboard/hc/arrange',
                        'type' => 'route',
                    ],
                    [
                        'label' => 'Reports',
                        'id' => '812nz4',
                        'action' => '/dashboard/reports',
                        'type' => 'route',
                        'permissions' => ['reports.view'],
                    ],
                    [
                        'id' => '5zGxwv',
                        'label' => 'Shortcut',
                        'permissions' => ['canned_replies.update'],
                        'action' => '/dashboard/saved-replies',
                        'type' => 'route',
                    ],
                    [
                        'label' => 'AI Agent',
                        'action' => '/dashboard/ai-agent',
                        'type' => 'route',
                        'id' => 'aidas1',
                        'permissions' => ['ai_agent.settings.update'],
                    ],
                    [
                        'label' => 'Billing',
                        'action' => '/dashboard/billing',
                        'type' => 'route',
                        'id' => 'billdash1',
                        'permissions' => ['admin'],
                    ],
                ],
            ],

            [
                'name' => 'Footer',
                'id' => '4tbwog',
                'positions' => ['footer'],
                'items' => [
                    [
                        'type' => 'route',
                        'id' => 'c1sf2g',
                        'position' => 1,
                        'label' => 'Developers',
                        'action' => '/api-docs',
                        'condition' => 'auth',
                        'permissions' => ['api.access'],
                    ],
                    [
                        'type' => 'route',
                        'id' => 'rlz27v',
                        'position' => 2,
                        'label' => 'Privacy Policy',
                        'action' => '/pages/privacy-policy',
                    ],
                    [
                        'type' => 'route',
                        'id' => 'p80pvk',
                        'position' => 3,
                        'label' => 'Terms of Service',
                        'action' => '/pages/terms-of-service',
                    ],
                ],
            ],
            [
                'name' => 'Footer Social',
                'id' => 'odw4ah',
                'positions' => ['footer-secondary'],
                'items' => [
                    [
                        'type' => 'link',
                        'id' => '6j747e',
                        'position' => 1,
                        'icon' => 'facebook',
                        'action' => 'https://facebook.com',
                    ],
                    [
                        'type' => 'link',
                        'id' => 'jo96zw',
                        'position' => 2,
                        'icon' => 'twitter',
                        'action' => 'https://twitter.com',
                    ],
                    [
                        'type' => 'link',
                        'id' => '57dsea',
                        'position' => 3,
                        'action' => 'https://instagram.com',
                        'icon' => 'instagram',
                    ],
                    [
                        'type' => 'link',
                        'id' => 'lzntr2',
                        'position' => 4,
                        'icon' => 'youtube',
                        'action' => 'https://youtube.com',
                    ],
                ],
            ],

            [
                'name' => 'Auth Dropdown',
                'id' => 'h8r6vg',
                'positions' => ['auth-dropdown'],
                'items' => [
                    [
                        'label' => 'Admin area',
                        'id' => 'upm1rv',
                        'action' => '/admin/settings',
                        'type' => 'route',
                        'permissions' => ['settings.update'],
                    ],
                    [
                        'label' => 'Dashboard',
                        'id' => 'ehj0ut',
                        'action' => '/dashboard/conversations?viewId=mine',
                        'type' => 'route',
                        'permissions' => ['conversations.update'],
                    ],
                    [
                        'label' => 'My tickets',
                        'id' => 'ehj0uk',
                        'action' => '/hc/tickets',
                        'type' => 'route',
                        'roles' => [1],
                    ],
                    [
                        'label' => 'Account settings',
                        'id' => '6a89z5',
                        'action' => '/account-settings',
                        'type' => 'route',
                    ],
                ],
            ],

            [
                'name' => 'Header Menu',
                'positions' => ['header'],
                'items' => [
                    [
                        'type' => 'route',
                        'id' => '6x80z1',
                        'label' => 'My Tickets',
                        'action' => '/hc/tickets',
                        'roles' => [1],
                    ],
                    [
                        'type' => 'route',
                        'id' => '6x80y2',
                        'label' => 'Dashboard',
                        'action' => '/dashboard',
                        'permissions' => ['conversations.update'],
                    ],
                ],
            ],
        ]),
    ],

    //tickets
    ['name' => 'replies.send_email', 'value' => true],
    ['name' => 'tickets.create_from_emails', 'value' => true],
    ['name' => 'tickets.send_ticket_created_notification', 'value' => false],
    ['name' => 'assignments.exclude_tickets', 'value' => true],

    //real time
    ['name' => 'realtime.enable', 'value' => false],
    ['name' => 'realtime.pusher_key', 'value' => null],

    //help center
    ['name' => 'articles.default_order', 'value' => 'position|desc'],

    [
        'name' => 'hcLanding',
        'value' => json_encode([
            'show_footer' => true,
            'articles_per_category' => 5,
            'children_per_category' => 6,
            'hide_small_categories' => 0,
            'header' => [
                'title' => 'How can we help you?',
                'subtitle' => 'Ask Questions. Browse Articles. Find Answers.',
                'placeholder' => 'Enter your question or keyword here',
                'background' => 'images/hc-header-pattern.svg',
                'variant' => 'colorful',
            ],
            'content' => [
                'variant' => 'articleGrid',
            ],
        ]),
    ],

    //new ticket page
    [
        'name' => 'hc.newTicket.appearance',
        'value' => json_encode([
            'title' => 'Submit a ticket',
            'submitButtonText' => 'Submit',
            'sidebarTitle' => 'Before you submit:',
            'sidebarTips' => [
                [
                    'title' => 'Tell us!',
                    'content' =>
                        'Add as much detail as possible, including site and page name.',
                ],
                [
                    'title' => 'Show us!',
                    'content' => 'Add a screenshot or a link to a video.',
                ],
            ],
        ]),
    ],

    // AI agent
    [
        'name' => 'aiAgent',
        'value' => json_encode([
            'name' => 'AI assistant',
            'greetingType' => 'basicGreeting',
            'basicGreeting' => [
                'message' => 'Hello! How can I help you today?',
                'flowIds' => [],
            ],
        ]),
    ],
];
