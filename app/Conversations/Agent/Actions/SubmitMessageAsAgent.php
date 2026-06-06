<?php

namespace App\Conversations\Agent\Actions;

use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Models\ConversationStatus;
use App\Core\Modules;
use Illuminate\Support\Facades\Auth;
use App\Contacts\Models\PageVisit;
use Livechat\Notifications\CustomerReceivedReplyWhileOffline;

class SubmitMessageAsAgent
{
    public function execute(
        Conversation $conversation,
        array $data,
    ): ConversationItem {
        $agent = Auth::user();
        $updatedEvent = new ConversationsUpdated([$conversation]);

        $data['author'] = Conversation::AUTHOR_AGENT;
        $data['user_id'] = $agent->id;
        $message = (new CreateConversationMessage())->execute(
            $conversation,
            $data,
        );

        $agent->touchLastActiveAt();

        // add tags
        if (isset($data['tags']) && !empty($data['tags'])) {
            $conversation->tags()->syncWithoutDetaching($data['tags']);
        }

        // change status, if needed
        $status = $this->resolveStatus($data);
        if ($status && $conversation->status_id !== $status->id) {
            Conversation::changeStatus($status, [$conversation]);
        }

        // assign conversation to agent that replied, if conversation is unnassigned
        if (!$conversation->assignee_id) {
            ConversationsAssigner::assignConversationsToAgent(
                [$conversation],
                $agent->id,
            );
        }

        if ($conversation->type === 'chat') {
            $this->handleChat($conversation, $message, $data);
        } else {
            $this->handleTicket($conversation, $message, $data);
        }

        event(new ConversationMessageCreated($conversation, $message));
        $updatedEvent->dispatch([$conversation]);

        return $message;
    }

    protected function handleTicket(
        Conversation $conversation,
        ConversationItem $message,
        array $data,
    ) {
        if ($message->type !== 'message') {
            return;
        }

        (new SendTicketReplyEmail())->execute($conversation, $message);
    }

    protected function handleChat(
        Conversation $conversation,
        ConversationItem $message,
        array $data,
    ): void {
        if ($message->type !== 'message' || !Modules::livechatInstalled()) {
            return;
        }

        $lastUrl = PageVisit::forUser($conversation->user)->latest()->first()
            ?->url;

        if (
            !$conversation->user->wasActiveRecently() &&
            $conversation->user->routeNotificationForMail() &&
            $message->user &&
            $lastUrl
        ) {
            $conversation->user->notify(
                new CustomerReceivedReplyWhileOffline(
                    $message->user,
                    $message,
                    $lastUrl,
                ),
            );
        }
    }

    protected function resolveStatus(array $data): ConversationStatus|null
    {
        if (isset($data['status_id'])) {
            return ConversationStatus::findOrFail($data['status_id']);
        }

        if (isset($data['status_name'])) {
            return ConversationStatus::where(
                'category',
                $data['status_name'] === 'open'
                    ? Conversation::STATUS_OPEN
                    : Conversation::STATUS_CLOSED,
            )
                ->orderBy('id', 'asc')
                ->first();
        }

        return null;
    }
}
