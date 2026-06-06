<?php

namespace Database\Seeders;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use Illuminate\Database\Seeder;

class ConversationStatusesSeeder extends Seeder
{
    public function run(): void
    {
        if (ConversationStatus::count() > 0) {
            return;
        }

        ConversationStatus::create([
            'label' => 'Open',
            'user_label' => 'In progress',
            'category' => Conversation::STATUS_OPEN,
            'internal' => true,
            'active' => true,
        ]);

        ConversationStatus::create([
            'label' => 'Pending',
            'user_label' => 'Waiting on you',
            'category' => Conversation::STATUS_PENDING,
            'internal' => true,
            'active' => true,
        ]);

        ConversationStatus::create([
            'label' => 'Resolved',
            'category' => Conversation::STATUS_CLOSED,
            'internal' => true,
            'active' => true,
        ]);

        ConversationStatus::create([
            'label' => 'Locked',
            'category' => Conversation::STATUS_LOCKED,
            'internal' => true,
            'active' => true,
        ]);
    }
}
