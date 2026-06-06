<?php

use App\Conversations\Agent\Notifications\Ticketing\Assigned\ConversationAssignedNotif;
use App\Conversations\Agent\Notifications\Ticketing\Assigned\ConvesationAssignedNotMeNotif;
use App\Conversations\Agent\Notifications\Ticketing\ConversationCreatedNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Agent\AgentRepliedToMyConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Agent\AgentRepliedToSomeoneElseConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Agent\AgentRepliedToUnassignedConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Customer\CustomerRepliedToMyConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Customer\CustomerRepliedToSomeoneElseConversationNotif;
use App\Conversations\Agent\Notifications\Ticketing\Messages\Customer\CustomerRepliedToUnassignedConversationNotif;

return [
    'available_channels' => ['email', 'browser', 'slack'],
    'subscriptions' => [
        [
            'group_name' => 'Notify me when…',
            'subscriptions' => [
                [
                    'name' => 'There is a new conversation',
                    'notif_id' => ConversationCreatedNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
                [
                    'name' => 'A conversation is assigned to me',
                    'notif_id' => ConversationAssignedNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
                [
                    'name' => 'A conversation is assigned to someone else',
                    'notif_id' => ConvesationAssignedNotMeNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
            ],
        ],
        [
            'group_name' => 'Notify me when a customer replies…',
            'subscriptions' => [
                [
                    'name' => 'To an unassigned conversation',
                    'notif_id' =>
                        CustomerRepliedToUnassignedConversationNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
                [
                    'name' => 'To one of my conversations',
                    'notif_id' =>
                        CustomerRepliedToMyConversationNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
                [
                    'name' => 'To a conversation owned by someone else',
                    'notif_id' =>
                        CustomerRepliedToSomeoneElseConversationNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
            ],
        ],
        [
            'group_name' => 'Notify me when agent replies or adds a note…',
            'subscriptions' => [
                [
                    'name' => 'To an unassigned conversation',
                    'notif_id' =>
                        AgentRepliedToUnassignedConversationNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
                [
                    'name' => 'To one of my conversations',
                    'notif_id' => AgentRepliedToMyConversationNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
                [
                    'name' => 'To a conversation owned by someone else',
                    'notif_id' =>
                        AgentRepliedToSomeoneElseConversationNotif::NOTIF_ID,
                    'user_type' => 'agent',
                ],
            ],
        ],
    ],
];
