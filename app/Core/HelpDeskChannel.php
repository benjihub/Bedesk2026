<?php

namespace App\Core;

class HelpDeskChannel
{
    const NAME = 'helpdesk';

    const EVENT_CONVERSATIONS_CREATED = 'conversations.created';
    const EVENT_CONVERSATIONS_UPDATED = 'conversations.updated';
    const EVENT_CONVERSATIONS_NEW_MESSAGE = 'conversations.newMessage';
    const EVENT_CONVERSATIONS_TYPING = 'conversations.typing';
    const EVENT_AGENTS_UPDATED = 'agents.updated';
    const EVENT_USERS_CREATED = 'users.created';
    const EVENT_USERS_PAGE_VISIT_CREATED = 'users.pageVisitCreated';
}
