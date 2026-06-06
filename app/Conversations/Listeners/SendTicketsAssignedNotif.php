<?php

namespace App\Conversations\Listeners;

use App\Conversations\Agent\Notifications\Ticketing\Assigned\ConversationAssignedNotif;
use App\Conversations\Agent\Notifications\Ticketing\Assigned\ConvesationAssignedNotMeNotif;
use App\Conversations\Events\ConversationsAssignedToAgent;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class SendTicketsAssignedNotif
{
    public function handle(ConversationsAssignedToAgent $event): void
    {
        $conversation = $event->conversations->first()->load('assignee');
        $assigner = Auth::user();

        // if conversation was not re-assigned at all, bail
        if ($assigner && $assigner?->isAgent()) {
            return;
        }

        // no need to notify agent if they assigned ticket to themselves
        if ($assigner && $assigner->id !== $conversation['assignee_id']) {
            // ticket assigned to me
            $user = User::where('id', $conversation['assignee_id'])
                ->whereNeedsNotificationFor(ConversationAssignedNotif::NOTIF_ID)
                ->first();
            if ($user) {
                Notification::send(
                    $user,
                    new ConversationAssignedNotif(
                        $event->conversations,
                        $assigner,
                    ),
                );
            }
        }

        // ticket assigned to someone else
        $users = User::where('id', '!=', $conversation['assignee_id'])
            ->whereNeedsNotificationFor(ConvesationAssignedNotMeNotif::NOTIF_ID)
            ->get();
        if ($users->isNotEmpty()) {
            Notification::send(
                $users,
                new ConvesationAssignedNotMeNotif(
                    $event->conversations,
                    $assigner,
                    $conversation->assignee,
                ),
            );
        }
    }
}
