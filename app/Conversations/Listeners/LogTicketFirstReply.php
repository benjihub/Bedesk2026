<?php

namespace App\Conversations\Listeners;

use App\Conversations\Actions\TicketEventLogger;
use App\Conversations\Events\ConversationMessageCreated;

class LogTicketFirstReply
{
    public function handle(ConversationMessageCreated $event): void
    {
        app(TicketEventLogger::class)->logFirstReply(
            $event->conversation,
            $event->message,
        );
    }
}
