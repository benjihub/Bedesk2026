<?php namespace App\Conversations\Email;

use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use App\Team\Models\Group;
use Illuminate\Support\Arr;

class CreateTicketForFailedOutgoingEmail
{
    public function execute(array $data): Conversation
    {
        $host = parse_url(config('app.url'))['host'];
        $user = User::firstOrCreate([
            'email' => "postmaster@$host",
        ]);

        $data = Arr::only($data, [
            'recipient',
            'reason',
            'description',
            'headers',
        ]);

        if (isset($data['headers'])) {
            $data['headers'] = collect($data['headers'])
                ->map(function ($value, $key) {
                    return "{$key}: {$value}";
                })
                ->implode(PHP_EOL);
        }

        $status = ConversationStatus::getDefaultOpen();

        $conversation = Conversation::create([
            'subject' => 'Failed Email Delivery Report',
            'user_id' => $user->id,
            'group_id' => Group::findDefault()?->id,
            'status_id' => $status->id,
            'status_category' => $status->category,
        ]);

        (new CreateConversationMessage())->execute($conversation, [
            'body' => view('tickets.failed-email-ticket-body')
                ->with($data)
                ->render(),
            'author' => 'system',
            'user_id' => $user->id,
        ]);

        return $conversation;
    }
}
