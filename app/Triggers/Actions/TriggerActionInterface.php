<?php namespace App\Triggers\Actions;

use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;

interface TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation;
}
