<?php

namespace App\Conversations\Agent\Notifications\Ticketing\Messages\Agent;

use App\Conversations\Agent\Notifications\Ticketing\Messages\NewMessageCreatedNotif;

class AgentRepliedToUnassignedConversationNotif extends NewMessageCreatedNotif
{
    public const NOTIF_ID = '07';
}
