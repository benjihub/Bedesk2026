<?php

namespace App\Conversations\Listeners;

use App\Conversations\Agent\Notifications\Ticketing\Messages\Agent\AgentRepliedToMyConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Agent\AgentRepliedToSomeoneElseConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Agent\AgentRepliedToUnassignedConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Customer\CustomerRepliedToMyConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Customer\CustomerRepliedToSomeoneElseConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Customer\CustomerRepliedToUnassignedConversationNotif;
use App\Conversations\Events\ConversationMessageCreated;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class SendReplyCreatedNotif implements ShouldQueue
{
    public function handle(ConversationMessageCreated $event): void
    {
        $conversation = $event->conversation;
        $message = $event->message;
        $replyFromAgent = $message->user?->isAgent();

        if ($conversation?->type !== 'ticket') {
            return;
        }

        if ($conversation->assignee_id) {
            // ticket assigned to me
            $notif1 = $replyFromAgent
                ? AgentRepliedToMyConversationNotif::class
                : CustomerRepliedToMyConversationNotif::class;
            $user = app(User::class)
                ->where('id', $conversation->assignee_id)
                ->where('id', '!=', $message->user_id)
                ->whereNeedsNotificationFor($notif1::NOTIF_ID)
                ->first();
            if ($user) {
                Notification::send($user, new $notif1($conversation, $message));
            }

            // ticket assigned to someone else
            $notif2 = $replyFromAgent
                ? AgentRepliedToSomeoneElseConversationNotif::class
                : CustomerRepliedToSomeoneElseConversationNotif::class;
            $users = User::where('id', '!=', $conversation->assignee_id)
                ->where('id', '!=', $message->user_id)
                ->whereNeedsNotificationFor($notif2::NOTIF_ID)
                ->get();
            if ($users->isNotEmpty()) {
                Notification::send(
                    $users,
                    new $notif2($conversation, $message),
                );
            }
        } else {
            // ticket is unassigned
            $notif3 = $replyFromAgent
                ? AgentRepliedToUnassignedConversationNotif::class
                : CustomerRepliedToUnassignedConversationNotif::class;

            $users = User::with('notificationSubscriptions')
                ->where('id', '!=', $message->user_id)
                ->whereNeedsNotificationFor($notif3::NOTIF_ID)
                ->get();
            if ($users->isNotEmpty()) {
                Notification::send(
                    $users,
                    new $notif3($conversation, $message),
                );
            }
        }
    }
}
