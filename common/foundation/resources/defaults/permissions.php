<?php

return [
    'roles' => [
        [
            'default' => true,
            'name' => 'users',
            'internal' => true,
            'type' => 'users',
            'permissions' => [
                'users.view',
                'localizations.view',
                'custom_pages.view',
                'files.create',
                'plans.view',
                'tags.view',
            ],
        ],
        [
            'guests' => true,
            'name' => 'guests',
            'internal' => true,
            'type' => 'users',
            'permissions' => [
                'users.view',
                'custom_pages.view',
                'plans.view',
                'tags.view',
                'localizations.view',
            ],
        ],
    ],
    'all' => [
        'admin' => [
            [
                'name' => 'admin',
                'display_name' => 'Admin',
                'description' => 'Gives full permissions.',
            ],
            [
                'name' => 'admin.access',
                'display_name' => 'Access admin area',
                'description' =>
                    'Required in order to access any admin area page.',
            ],
            [
                'name' => 'appearance.update',
                'display_name' => 'Appearance editor',
                'description' => 'Allows access to appearance editor.',
            ],
        ],

        'api' => [
            [
                'name' => 'api.access',
                'display_name' => 'REST API',
                'user_types' => ['user', 'admin'],
                'description' =>
                    'Allow users to use the API and access API section in their account settings page.',
            ],
        ],

        'roles' => [
            [
                'name' => 'roles.update',
                'display_name' => 'Role management',
                'description' => 'Allow role management from admin area.',
                'advanced' => true,
            ],
        ],

        'custom_pages' => [
            // todo: move to belink
            [
                'name' => 'custom_pages.create',
                'advanced' => true,
                'user_types' => ['user'],
                'display_name' => 'Create link pages',
                'description' => 'Allow creating custom link pages.',
                'restrictions' => [
                    [
                        'name' => 'count',
                        'type' => 'number',
                        'description' => __('policies.count_description', [
                            'resources' => 'pages',
                        ]),
                    ],
                ],
            ],
            [
                'name' => 'custom_pages.update',
                'advanced' => true,
                'display_name' => 'Manage custom pages',
                'description' =>
                    'Allow custom page management from admin area.',
            ],
        ],

        // todo: move to architect/belink
        'custom_domains' => [
            [
                'name' => 'custom_domains.create',
                'user_types' => ['user'],
                'display_name' => 'Connect custom domains',
                'description' =>
                    'Allow user to connect their own custom domains.',
                'restrictions' => [
                    [
                        'name' => 'count',
                        'type' => 'number',
                        'description' => __('policies.count_description', [
                            'resources' => 'domains',
                        ]),
                    ],
                ],
            ],
            [
                'name' => 'custom_domains.update',
                'advanced' => true,
                'display_name' => 'Manage custom domains',
                'description' =>
                    'All custom domain management from admin area.',
            ],
        ],

        'files' => [
            [
                'name' => 'files.update',
                'advanced' => true,
                'display_name' => 'Manage files',
                'description' => 'Allow file management from admin area.',
            ],
        ],

        'users' => [
            [
                'name' => 'users.view',
                'advanced' => false,
                'user_types' => ['user'],
                'display_name' => 'View users',
                'description' =>
                    'Allow viewing public profiles of other users.',
            ],
            [
                'name' => 'users.update',
                'advanced' => true,
                'display_name' => 'Manage users',
                'description' => 'Allow user management from admin area.',
            ],
        ],

        'localizations' => [
            [
                'name' => 'localizations.update',
                'advanced' => true,
                'display_name' => 'Manage localizations',
                'description' =>
                    'Allow localization management from admin area.',
            ],
        ],

        'settings' => [
            [
                'name' => 'settings.update',
                'advanced' => true,
                'display_name' => 'Manage settings',
                'description' => 'Allow settings management from admin area.',
            ],
        ],

        'plans' => [
            [
                'name' => 'plans.update',
                'advanced' => true,
                'display_name' => 'Manage plans',
                'description' =>
                    'Allow subscription plan management from admin area.',
            ],
        ],

        'tags' => [
            [
                'name' => 'tags.update',
                'advanced' => true,
                'display_name' => 'Manage tags',
                'description' => 'Allow tag management from admin area.',
            ],
        ],

        'workspaces' => [
            [
                'name' => 'workspaces.create',
                'display_name' => 'Create workspaces',
                'description' => 'Allow workspace creation.',
                'restrictions' => [
                    [
                        'name' => 'count',
                        'type' => 'number',
                        'description' => __('policies.count_description', [
                            'resources' => 'workspaces',
                        ]),
                    ],
                    [
                        'name' => 'member_count',
                        'type' => 'number',
                        'description' =>
                            'Maximum number of members workspace is allowed to have.',
                    ],
                ],
            ],
            [
                'name' => 'workspaces.update',
                'advanced' => true,
                'display_name' => 'Manage workspaces',
                'description' => 'Allow workspace management from admin area.',
            ],
        ],
        'workspace_members' => [
            [
                'name' => 'workspace_members.invite',
                'display_name' => 'Invite Members',
                'type' => 'workspace',
                'description' =>
                    'Allow user to invite new members into a workspace.',
            ],
            [
                'name' => 'workspace_members.update',
                'display_name' => 'Update Members',
                'type' => 'workspace',
                'description' => 'Allow user to change role of other members.',
            ],
            [
                'name' => 'workspace_members.delete',
                'display_name' => 'Delete Members',
                'type' => 'workspace',
                'description' => 'Allow user to remove members from workspace.',
            ],
        ],
    ],
];
