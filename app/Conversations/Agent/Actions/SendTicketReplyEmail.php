<?php

namespace App\Conversations\Agent\Actions;

use App\Conversations\Email\Mailables\TicketReplyMailable;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendTicketReplyEmail
{
    public function execute(Conversation $ticket, ConversationItem $reply): void
    {
        if (
            settings('replies.send_email') &&
            // check if user has any email address
            $ticket->user->routeNotificationForMail()
        ) {
            try {
                Mail::send(new TicketReplyMailable($ticket, $reply));
            } catch (Exception $e) {
                if (!app()->environment('production')) {
                    throw $e;
                } else {
                    Log::error($e);
                }
            }
        }
    }
}
