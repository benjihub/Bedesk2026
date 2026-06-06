<?php

namespace Database\Seeders;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationView;
use Illuminate\Database\Seeder;

class DefaultViewsSeeder extends Seeder
{
    public function run(): void
    {
        if (ConversationView::where('internal', true)->exists()) {
            return;
        }

        $data = [
            [
                'key' => 'mine',
                'name' => 'Your chats',
                'pinned' => true,
                'internal' => true,
                'icon' => 'inbox',
                'order_by' => 'status_category',
                'order_dir' => 'desc',
                'conditions' => json_encode([
                    [
                        'key' => 'assignee_id',
                        'operator' => '=',
                        'value' => 'currentUser',
                        'match_type' => 'all',
                    ],
                    [
                        'key' => 'status_category',
                        'operator' => '>',
                        'value' => Conversation::STATUS_PENDING,
                        'match_type' => 'all',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'unassigned',
                'name' => 'Unassigned',
                'pinned' => true,
                'internal' => false,
                'icon' => 'unassigned',
                'order_by' => 'status_category',
                'order_dir' => 'desc',
                'conditions' => json_encode([
                    [
                        'key' => 'assignee_id',
                        'operator' => '=',
                        'value' => 'null',
                        'match_type' => 'all',
                    ],
                    [
                        'key' => 'status_category',
                        'operator' => '>',
                        'value' => Conversation::STATUS_PENDING,
                        'match_type' => 'all',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'closed',
                'name' => 'Closed',
                'icon' => 'archive',
                'pinned' => true,
                'internal' => false,
                'order_by' => 'conversations.updated_at',
                'order_dir' => 'desc',
                'conditions' => json_encode([
                    [
                        'key' => 'status_category',
                        'operator' => '<=',
                        'value' => Conversation::STATUS_CLOSED,
                        'match_type' => 'all',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'all',
                'name' => 'All',
                'icon' => 'team',
                'pinned' => true,
                'internal' => true,
                'order_by' => 'conversations.updated_at',
                'order_dir' => 'desc',
                'conditions' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'groups',
                'name' => 'Groups',
                'icon' => null,
                'pinned' => false,
                'internal' => true,
                'order_by' => 'conversations.updated_at',
                'order_dir' => 'desc',
                'conditions' => json_encode([
                    [
                        'key' => 'status_category',
                        'operator' => '>',
                        'value' => Conversation::STATUS_PENDING,
                        'match_type' => 'all',
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        ConversationView::insert($data);
    }
}
