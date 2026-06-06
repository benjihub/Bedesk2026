<?php

namespace App\Demo;

use App\Conversations\Actions\ConversationEventsCreator;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Models\User;
use App\Team\Models\Group;
use Common\Files\FileEntry;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;

class CreateDemoMessages
{
    protected Collection $attachments;
    protected Collection $agents;
    protected Collection $groups;
    protected array $subjects;
    protected Collection $ticketContents;

    public function __construct()
    {
        $this->attachments = FileEntry::get();
        $this->agents = User::where('type', 'agent')->get();
        $this->groups = Group::get();
        $this->subjects = json_decode(
            file_get_contents(
                base_path('resources/demo/tickets/subjects.json'),
            ),
            true,
        );
        $this->ticketContents = collect(
            File::allFiles(base_path('resources/demo/tickets/content')),
        )->map(
            fn($file) => json_decode(
                file_get_contents($file->getPathname()),
                true,
            ),
        );
    }

    public function execute(): void
    {
        $conversations = Conversation::get();

        $chatContents = collect(
            File::allFiles(base_path('resources/demo/chats')),
        )
            ->map(
                fn($file) => json_decode(
                    file_get_contents($file->getPathname()),
                    true,
                ),
            )
            ->toArray();

        foreach ($conversations as $conversation) {
            $messages =
                $conversation->type === 'chat'
                    ? Arr::random($chatContents)
                    : $this->getTicketMessages($conversation);

            // if conversation is queued, leave only first customer message
            if (
                $conversation->status_category === Conversation::STATUS_OPEN &&
                !$conversation->assignee_id
            ) {
                $messages = array_slice($messages, 0, 1);
            }

            // if conversation is active, remove last messages
            elseif (
                $conversation->status_category === Conversation::STATUS_OPEN
            ) {
                $messages = array_slice($messages, 0, count($messages) - 5);
            }

            $previousMessage = null;
            foreach ($messages as $message) {
                $message = $this->createChatMessage(
                    $conversation,
                    $previousMessage,
                    $message,
                );
                $previousMessage = $message;
            }
        }
    }

    protected function createChatMessage(
        Conversation $conversation,
        ?ConversationItem $previousMessage,
        array $data,
    ): ConversationItem {
        $eventCreator = new ConversationEventsCreator($conversation);

        $date = $previousMessage
            ? $previousMessage->created_at->addSeconds(rand(20, 150))
            : $conversation->created_at;

        $newAgent =
            $this->agents->firstWhere('id', $conversation->assignee_id) ??
            $this->agents->random();

        $oldAgent = $this->agents
            ->filter(fn(User $agent) => $agent->id !== $newAgent->id)
            ->random();

        $newGroup = $conversation->group_id
            ? $this->groups->firstWhere('id', $conversation->group_id)
            : $this->groups->firstWhere('default');

        $body = $data['content'] ?? $data['body'];

        if ($data['type'] === 'event') {
            $event = match ($body) {
                ConversationEventsCreator::CUSTOMER_LEFT_CHAT
                    => $eventCreator->customerLeftChat(),
                ConversationEventsCreator::AGENT_LEFT_CHAT
                    => $eventCreator->agentLeftChat($oldAgent, $newAgent),
                ConversationEventsCreator::CUSTOMER_IDLE
                    => $eventCreator->customerIdle(),
                ConversationEventsCreator::CLOSED_INACTIVITY
                    => $eventCreator->closedDueToInactivity(),
                ConversationEventsCreator::AGENT_CHANGED
                    => $eventCreator->agentChanged($newAgent),
                ConversationEventsCreator::GROUP_CHANGED
                    => $eventCreator->groupChanged($newGroup),
                ConversationEventsCreator::CLOSED_BY_AGENT
                    => $eventCreator->closedByAgent($newAgent),
                default => throw new \Exception(
                    "Unknown event type: {$data['body']}",
                ),
            };
            $event->update([
                'created_at' => $date,
                'updated_at' => $date,
            ]);
            return $event;
        } else {
            $message = $conversation->items()->create([
                'type' => 'message',
                'body' => $body,
                'author' => $data['author'],
                'user_id' =>
                    $data['author'] === 'agent'
                        ? $newAgent->id
                        : $conversation->user_id,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            if (Arr::get($data, 'hasAttachments')) {
                $message
                    ->attachments()
                    ->attach($this->attachments->pluck('id')->random(3));
            }

            return $message;
        }
    }

    protected function getTicketMessages(Conversation $conversation)
    {
        // get ticket content based on which demo subject was used for this ticket
        foreach ($this->subjects as $groupKey => $subjectGroup) {
            foreach ($subjectGroup as $subject) {
                if ($subject === $conversation->subject) {
                    return $this->ticketContents[$groupKey];
                }
            }
        }
    }
}
