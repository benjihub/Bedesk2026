<?php

namespace App\Conversations\Actions;

use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Models\User;
use App\Team\Models\Group;

class ConversationEventsCreator
{
    const CLOSED_INACTIVITY = 'closed.inactivity';
    const CLOSED_BY_AGENT = 'closed.byAgent';
    const CLOSED_BY_CUSTOMER = 'closed.byCustomer';
    const CLOSED_BY_TRIGGER = 'closed.byTrigger';
    const CLOSED_BY_AI_AGENT = 'closed.byAiAgent';
    const CUSTOMER_IDLE = 'customer.idle';
    const CUSTOMER_LEFT_CHAT = 'customer.leftChat';
    const CUSTOMER_ADDED_TO_QUEUE = 'customer.addedToQueue';
    const AGENT_LEFT_CHAT = 'agent.leftChat';
    const AGENT_CHANGED = 'agent.changed';
    const GROUP_CHANGED = 'group.changed';
    const CUSTOMER_ENTERED_EMAIL = 'customer.enteredEmail';

    public function __construct(protected Conversation $conversation) {}

    public function customerLeftChat(): ConversationItem
    {
        return $this->createEvent(self::CUSTOMER_LEFT_CHAT);
    }

    public function agentLeftChat(
        User|array|null $oldAgent = null,
        User|array|null $newAgent = null,
    ): ConversationItem {
        $data = [];
        if ($oldAgent) {
            $data['oldAgent'] = $oldAgent['name'];
        }
        if ($newAgent) {
            $data['newAgent'] = $newAgent['name'];
        }
        return $this->createEvent(self::AGENT_LEFT_CHAT, $data);
    }

    public function customerIdle(): ConversationItem
    {
        return $this->createEvent(self::CUSTOMER_IDLE);
    }

    public function closedDueToInactivity(): ConversationItem
    {
        return $this->createEvent(self::CLOSED_INACTIVITY);
    }

    public function agentChanged(User $newAgent): ConversationItem
    {
        return $this->createEvent(self::AGENT_CHANGED, [
            'newAgent' => $newAgent['name'],
        ]);
    }

    public function addedToQueue(): ConversationItem
    {
        return $this->createEvent(self::CUSTOMER_ADDED_TO_QUEUE);
    }

    public function groupChanged(Group|array $newGroup): ConversationItem
    {
        return $this->createEvent(self::GROUP_CHANGED, [
            'newGroup' => $newGroup['name'],
        ]);
    }

    public function closedByAgent(User|array $closedBy): ConversationItem
    {
        return $this->createEvent(self::CLOSED_BY_AGENT, [
            'closedBy' => $closedBy['name'],
        ]);
    }

    public function closedByCustomer(User|array $customer): ConversationItem
    {
        return $this->createEvent(self::CLOSED_BY_CUSTOMER, [
            'closedBy' => $customer['name'],
        ]);
    }

    public function closedByAiAgent(): ConversationItem
    {
        return $this->createEvent(self::CLOSED_BY_AI_AGENT);
    }

    public function closedByTrigger(): ConversationItem
    {
        return $this->createEvent(self::CLOSED_BY_TRIGGER);
    }

    public function userEnteredEmail(string $email): ConversationItem
    {
        return $this->createEvent(self::CUSTOMER_ENTERED_EMAIL, [
            'email' => $email,
        ]);
    }

    public function createEvent(
        string $name,
        array $data = [],
    ): ConversationItem {
        $data['name'] = $name;
        return (new CreateConversationMessage())->execute($this->conversation, [
            'type' => 'event',
            'body' => $data,
            'author' => 'system',
            'created_at' => $data['created_at'] ?? now(),
            'updated_at' => $data['updated_at'] ?? now(),
        ]);
    }
}
