<?php

namespace Livechat\Chats;

use App\Conversations\Actions\ConversationEventsCreator;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Core\HelpDeskChannel;
use App\Models\User;
use Common\Auth\UserSession;
use Common\Websockets\API\WebsocketAPI;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;

class ChatCycle
{
    /**
     * @var Collection<User>
     */
    protected Collection $allAgents;

    public function run(): void
    {
        $this->prepareUsersAndAgents();

        $closedStatus = ConversationStatus::getDefaultClosed();

        $activeChats = Conversation::query()
            ->where('type', 'chat')
            ->whereNotClosed()
            ->whereAssignedToHuman()
            ->with([
                'status',
                'latestMessage',
                'latestAgentMessage',
                'latestEvent',
                'group',
                'user.latestUserSession',
                'assignee.latestUserSession',
            ])
            ->when(
                // exclude demo chats from being affected by ChatCycle
                config('app.demo'),
                fn($query) => $query->where('id', '>', 130),
            )
            ->limit(50)
            ->get();

        foreach ($activeChats as $chat) {
            $eventCreator = new ConversationEventsCreator($chat);

            // customer left chat, close chat and create event
            if (!$chat->user->wasActiveRecently(180)) {
                Conversation::changeStatus($closedStatus, [$chat]);
                $eventCreator->customerLeftChat();
                continue;
            }

            // assigned agent is offline, reassign chat to another available agent
            if ($chat->assignee && !$chat->assignee->wasActiveRecently()) {
                $this->reassignChat($chat, cooldownMinutes: 180);
                continue;
            }

            // if agent has not responded for a while, reassign chat
            if (
                $chat->latestMessage &&
                $chat->latestMessage->author === 'user' &&
                settings('lc.timeout.agent')
            ) {
                if (
                    $chat->latestMessage->created_at->diffInMinutes(now()) >
                    settings('lc.timeout.agent')
                ) {
                    $this->reassignChat(
                        $chat,
                        cooldownMinutes: settings('lc.timeout.agent'),
                    );
                    continue;
                }
            }

            // if there has been no activity for a while, set chat status to pending
            if (
                settings('lc.timeout.inactive') &&
                $chat->status_category > Conversation::STATUS_PENDING &&
                $this->latestMessageOrEventIsOlderThan(
                    settings('lc.timeout.inactive'),
                    $chat,
                )
            ) {
                $eventCreator->customerIdle();
                Conversation::changeStatus(
                    ConversationStatus::getDefaultPending(),
                    [$chat],
                );
                continue;
            }

            // if there have been no activity for a while and chat is pending, mark chat as closed
            if (
                settings('lc.timeout.archive') &&
                $chat->status_category === Conversation::STATUS_PENDING &&
                $this->latestMessageOrEventIsOlderThan(
                    settings('lc.timeout.archive'),
                    $chat,
                )
            ) {
                Conversation::changeStatus($closedStatus, [$chat]);
                $eventCreator->closedDueToInactivity();
                continue;
            }
        }

        ConversationsAssigner::distributeUnassignedConversationsToAvailableAgents(
            addEvent: true,
        );
    }

    protected function reassignChat(
        Conversation $chat,
        int $cooldownMinutes,
    ): Conversation {
        // only reassign if chat was last reassigned more then $cooldownMinutes ago
        if (
            $chat->assigned_at &&
            $chat->assigned_at->diffInMinutes(now()) < $cooldownMinutes
        ) {
            return $chat;
        }

        $oldAgent = $chat->assignee_id
            ? $this->allAgents->firstWhere('id', $chat->assignee_id)
            : null;

        $chat = ConversationsAssigner::assignConversationToFirstAvailableAgent(
            $chat,
            except: $oldAgent ? [$oldAgent->id] : null,
            addEvent: true,
        );

        $newAgent = $chat->assignee_id
            ? $this->allAgents->firstWhere('id', $chat->assignee_id)
            : null;

        if ($oldAgent?->id !== $newAgent?->id) {
            (new ConversationEventsCreator($chat))->agentLeftChat(
                $oldAgent,
                $newAgent,
            );
        }

        return $chat;
    }

    protected function prepareUsersAndAgents(): void
    {
        try {
            $onlineUserIds = app(WebsocketAPI::class)->getActiveUsersInChannel(
                HelpDeskChannel::NAME,
            );
        } catch (ConnectionException $e) {
            $onlineUserIds = collect();
        }

        $this->allAgents = User::whereAgent()
            ->with(['latestUserSession', 'agentSettings'])
            ->get();

        $onlineAgentsSessionIds = $this->allAgents
            ->filter(fn($agent) => $onlineUserIds->contains($agent->id))
            ->pluck('latestUserSession.id')
            ->toArray();

        // touch user sessions. agent will be considered offline
        // if active session was last updated more then a minute ago
        UserSession::whereIn('id', $onlineAgentsSessionIds)->touch(
            'updated_at',
        );
    }

    protected function latestMessageOrEventIsOlderThan(
        int $minutes,
        Conversation $chat,
    ): bool {
        return ($chat->latestMessage &&
            $chat->latestMessage->created_at->diffInMinutes(now()) >
                $minutes) ||
            ($chat->latestEvent &&
                $chat->latestEvent->created_at->diffInMinutes(now()) >
                    $minutes);
    }
}
