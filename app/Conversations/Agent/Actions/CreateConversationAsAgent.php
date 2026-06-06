<?php

namespace App\Conversations\Agent\Actions;

use App\Conversations\Events\ConversationCreated;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use App\Team\Models\Group;
use Illuminate\Support\Facades\Auth;

class CreateConversationAsAgent
{
    public function execute(array $data): Conversation
    {
        // Make sure updated event is not fired until chat is fully created
        ConversationsUpdated::pauseDispatching();

        $user = User::findOrFail($data['user_id']);
        $groupId = isset($data['group_id'])
            ? Group::find($data['group_id'])?->id
            : Group::findDefault()?->id;

        // if it's a chat, always use "open" status, otherwise use specified status
        $status = ConversationStatus::findOrGetDefaultOpen(
            $data['type'] === 'chat' ? null : $data['status_id'] ?? null,
        );

        $conversation = $user->conversations()->create([
            'subject' => $data['subject'] ?? null,
            'status_id' => $status->id,
            'status_category' => $status->category,
            'group_id' => $groupId,
            'type' => $data['type'] ?? 'ticket',
            'channel' => $data['channel'] ?? 'website',
            // keep original request IP on the conversation so we can display it
            'request_ip' => getIp(),
        ]);

        if (isset($data['attributes'])) {
            $conversation->updateCustomAttributes($data['attributes']);
        }

        $data['message']['author'] = 'agent';
        $data['message']['user_id'] = Auth::id();
        (new CreateConversationMessage())->execute(
            $conversation,
            $data['message'],
        );

        $conversation = ConversationsAssigner::assignConversationsToAgent(
            [$conversation],
            Auth::id(),
        )->first();

        event(new ConversationCreated($conversation));

        return $conversation;
    }
}
