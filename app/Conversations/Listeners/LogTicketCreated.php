<?php

namespace App\Conversations\Listeners;

use App\Conversations\Actions\TicketEventLogger;
use App\Conversations\Events\ConversationCreated;

class LogTicketCreated
{
    public function handle(ConversationCreated $event): void
    {
        app(TicketEventLogger::class)->logCreated($event->conversation);
    }
}
