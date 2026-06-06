<?php

namespace App\Conversations\Customer\Actions;

use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Models\ConversationStatus;

class SubmitMessageAsCustomer
{
    public function execute(
        Conversation $conversation,
        array $messageData,
    ): ConversationItem {
        $updatedEvent = new ConversationsUpdated([$conversation]);

        $messageData['author'] = Conversation::AUTHOR_USER;
        $message = (new CreateConversationMessage())->execute(
            $conversation,
            $messageData,
        );

        $conversation->user->touchLastActiveAt();

        event(new ConversationMessageCreated($conversation, $message));
        $updatedEvent->dispatch([$conversation]);

        if ($conversation->status_category <= Conversation::STATUS_OPEN) {
            Conversation::changeStatus(ConversationStatus::getDefaultOpen(), [
                $conversation,
            ]);
        }

        return $message;
    }
}
