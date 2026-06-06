<?php

namespace App\Conversations\Commands;

use App\Conversations\Models\Conversation;
use Illuminate\Console\Command;

class DeleteTestConversationsCommand extends Command
{
    protected $signature = 'testConversations:delete';

    public function handle()
    {
        Conversation::where('mode', Conversation::MODE_PREVIEW)
            ->where('updated_at', '<', now()->subMinutes(55))
            ->delete();
    }
}
