<?php namespace App\Triggers\Actions;

use App\Conversations\Agent\Notifications\TriggerEmailNotification;
use App\Conversations\Models\Conversation;
use App\Models\User;
use App\Triggers\Models\Trigger;

class SendEmailToUserAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $data = $action['value'];
        $user = User::find($data['agent_id']);

        if ($user) {
            $data['conversation'] = $conversation->toArray();
            $data['user'] = $user->toArray();
            if ($conversation->latestMessage) {
                $data['last_message'] = $conversation->latestMessage->toArray();
            }

            $user->notify(new TriggerEmailNotification($data));
        }

        return $conversation;
    }
}
