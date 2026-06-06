<?php

namespace App\Conversations\Agent\Notifications\Ticketing\Messages\Customer;

use App\Conversations\Agent\Notifications\Ticketing\Messages\NewMessageCreatedNotif;

class CustomerRepliedToSomeoneElseConversationNotif extends
    NewMessageCreatedNotif
{
    public const NOTIF_ID = '06';
}
