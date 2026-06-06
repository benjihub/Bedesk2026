<?php

namespace Livechat\Commands;

use Illuminate\Console\Command;
use Livechat\Chats\ChatCycle;

class ChatCycleCommand extends Command
{
    protected $signature = 'chats:runCycle';

    public function handle(): int
    {
        (new ChatCycle())->run();

        return 0;
    }
}
