<?php

namespace App\Demo;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationView;

class CreateDemoViews
{
    public function execute()
    {
        ConversationView::insert([
            [
                'name' => 'Shipping',
                'access' => 'anyone',
                'pinned' => false,
                'order' => 0,
                'owner_id' => 1,
                'order_by' => 'updated_at',
                'order_dir' => 'desc',
                'created_at' => now(),
                'updated_at' => now(),
                'conditions' => json_encode([
                    [
                        'key' => 'ca_category',
                        'operator' => '=',
                        'value' => 'shipping',
                        'match_type' => 'all',
                    ],
                    [
                        'key' => 'status_category',
                        'operator' => '>',
                        'value' => Conversation::STATUS_CLOSED,
                    ],
                ]),
            ],
            [
                'name' => 'Billing',
                'access' => 'anyone',
                'pinned' => false,
                'order' => 1,
                'owner_id' => 1,
                'order_by' => 'updated_at',
                'order_dir' => 'desc',
                'created_at' => now(),
                'updated_at' => now(),
                'conditions' => json_encode([
                    [
                        'key' => 'ca_category',
                        'operator' => '=',
                        'value' => 'payment',
                        'match_type' => 'all',
                    ],
                    [
                        'key' => 'status_category',
                        'operator' => '>',
                        'value' => Conversation::STATUS_CLOSED,
                    ],
                ]),
            ],
            [
                'name' => 'Installation',
                'access' => 'anyone',
                'pinned' => false,
                'order' => 2,
                'owner_id' => 1,
                'order_by' => 'updated_at',
                'order_dir' => 'desc',
                'created_at' => now(),
                'updated_at' => now(),
                'conditions' => json_encode([
                    [
                        'key' => 'ca_category',
                        'operator' => '=',
                        'value' => 'installation',
                        'match_type' => 'all',
                    ],
                    [
                        'key' => 'status_category',
                        'operator' => '>',
                        'value' => Conversation::STATUS_CLOSED,
                    ],
                ]),
            ],
            [
                'name' => 'Customization',
                'access' => 'anyone',
                'pinned' => false,
                'order' => 3,
                'owner_id' => 1,
                'order_by' => 'updated_at',
                'order_dir' => 'desc',
                'created_at' => now(),
                'updated_at' => now(),
                'conditions' => json_encode([
                    [
                        'key' => 'ca_category',
                        'operator' => '=',
                        'value' => 'configuration',
                        'match_type' => 'all',
                    ],
                    [
                        'key' => 'status_category',
                        'operator' => '>',
                        'value' => Conversation::STATUS_CLOSED,
                    ],
                ]),
            ],
        ]);
    }
}
