<?php

namespace App\Conversations\Customer\Actions;

use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Agent\Notifications\Ticketing\ConversationCreatedNotif;
use App\Conversations\Email\Mailables\TicketReceivedMailable;
use App\Conversations\Events\ConversationCreated;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use App\Team\Models\Group;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

class CreateTicketAsCustomer
{
    public function execute(array $data, User $user): Conversation
    {
        // Make sure updated event is not fired until chat is fully created
        ConversationsUpdated::pauseDispatching();

        $groupId = isset($data['group_id'])
            ? Group::find($data['group_id'])?->id
            : Group::findDefault()?->id;
        $status = ConversationStatus::findOrGetDefaultOpen(
            $data['status_id'] ?? null,
        );

        $conversation = $user->conversations()->create([
            'type' => 'ticket',
            'subject' => $data['subject'] ?? null,
            'status_id' => $status->id,
            'status_category' => $status->category,
            'group_id' => $groupId,
            'channel' => $data['channel'] ?? null,
            'received_at_email' => $data['received_at_email'] ?? null,
            // store the IP of the request that triggered this ticket
            'request_ip' => getIp(),
        ]);

        if (isset($data['attributes'])) {
            $conversation->updateCustomAttributes($data['attributes']);
        }

        $data['message']['author'] = 'user';
        $data['message']['user_id'] = $user->id;
        $message = (new CreateConversationMessage())->execute(
            $conversation,
            $data['message'],
        );

        $conversation = ConversationsAssigner::assignConversationRoundRobin(
            $conversation,
        );

        event(new ConversationCreated($conversation));

        $this->sendTicketReceivedEmail($conversation, $message);

        // notification to agent that ticket was created
        $users = app(User::class)
            ->whereNeedsNotificationFor(ConversationCreatedNotif::NOTIF_ID)
            ->get();
        Notification::send($users, new ConversationCreatedNotif($conversation));

        return $conversation;
    }

    protected function sendTicketReceivedEmail(
        Conversation $conversation,
        ConversationItem $message,
    ): void {
        if (settings('tickets.send_ticket_created_notification')) {
            try {
                Mail::send(new TicketReceivedMailable($conversation, $message));
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
