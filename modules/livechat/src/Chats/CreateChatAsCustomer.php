<?php

namespace Livechat\Chats;

use Ai\AiAgent\Models\AiAgentSession;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Events\ConversationCreated;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Models\ConversationStatus;
use App\Team\Models\Group;
use App\Core\WidgetFlags;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class CreateChatAsCustomer
{
    public function execute(array $data): Conversation
    {
        Log::info('Starting CreateChatAsCustomer', $data);
        $flowId = Arr::get($data, 'flowId');
        $preChatForm = $data['preChatForm'] ?? [];
        $department = $data['department'] ?? null;
        $startWithGreeting = Arr::get($data, 'startWithGreeting', false);
        $isAiAgentPreviewMode = WidgetFlags::isAiAgentPreviewMode();

        // Make sure updated event is not fired until chat is fully created
        ConversationsUpdated::pauseDispatching();

        try {
            $status = ConversationStatus::getDefaultOpen();

            $assignedTo =
                settings('aiAgent.enabled') || $isAiAgentPreviewMode
                    ? Conversation::ASSIGNED_BOT
                    : Conversation::ASSIGNED_AGENT;

            // determine group id: prefer explicit department passed, fall back
            // to pre-chat form group or default group
            $groupId = null;
            if ($department) {
                if (is_numeric($department)) {
                    $group = Group::find((int) $department);
                    if ($group) {
                        $groupId = $group->id;
                    }
                } else {
                    $group = Group::query()->where('name', $department)->first();
                    $groupId = $group?->id;
                }
            }

            if (!$groupId) {
                $groupId = $preChatForm['group_id'] ?? Group::findDefault()?->id;
            }

            Log::info('Creating chat with department: ' . $department . ', determined groupId: ' . $groupId);

            $conversation = auth('chatWidget')->user()
                ->conversations()
                ->create([
                    'type' => 'ticket',
                    'status_id' => $status->id,
                    'status_category' => $status->category,
                    // group selected by department param, pre-chat form or default one
                    'group_id' => $groupId,
                    'channel' => $data['channel'] ?? 'widget',
                    'assigned_to' => $assignedTo,
                    'ai_agent_involved' =>
                        $assignedTo === Conversation::ASSIGNED_BOT,
                    'mode' => $isAiAgentPreviewMode
                        ? Conversation::MODE_PREVIEW
                        : Conversation::MODE_NORMAL,
                    // store the IP of the request that created this chat so we
                    // can surface it later even if session data is missing or
                    // the session record ended up with an empty address.
                    'request_ip' => getIp(),
                ]);

            // make sure we use user from conversation everything, so if any attribute is overwritten, it will be reflected in new messages created below when using variable replacer
            $customer = $conversation->user;

            // handle pre-chat form
            if (!empty($preChatForm)) {
                (new StoreChatFormData())->execute(
                    'preChat',
                    $conversation,
                    $preChatForm,
                );
            }

            // if starting with flow, first insert greeting flow nodes, then insert user message, then execute flow from the last greeting node. This will be the same order as when creating a message for existing chat
            if ($startWithGreeting) {
                $newChatGreeting = (new BuildNewChatGreeting(
                    $customer,
                    $flowId,
                ))->execute();
                isset($newChatGreeting['flow_id'])
                    ? $this->handleFlowGreeting($conversation, $newChatGreeting)
                    : $this->handleBasicGreeting($conversation, $newChatGreeting);
            }

            AiAgentSession::pinAgentForConversation(
                $conversation,
                is_numeric(Arr::get($data, 'aiAgentId'))
                    ? (int) Arr::get($data, 'aiAgentId')
                    : null,
            );

            if (isset($data['message'])) {
                $data['message']['author'] = Conversation::AUTHOR_USER;
                (new CreateConversationMessage())->execute(
                    $conversation,
                    $data['message'],
                );
            }

            if ($conversation->assigned_to === Conversation::ASSIGNED_AGENT) {
                ConversationsAssigner::assignConversationToFirstAvailableAgent(
                    $conversation,
                );
            }

            $conversation = $conversation->fresh();

            event(new ConversationCreated($conversation));

            return $conversation;
        } finally {
            ConversationsUpdated::resumeDispatching();
        }
    }

    protected function handleBasicGreeting(
        Conversation $conversation,
        array $basicGreeting,
    ): ConversationItem|null {
        $lastMessage = null;
        foreach ($basicGreeting['parts'] as $part) {
            // hide buttons after user input
            if ($part['type'] === 'buttons') {
                $part['body'] = $part['body']['message'];
                $part['type'] = 'message';
            }

            $lastMessage = (new CreateConversationMessage())->execute(
                $conversation,
                $part,
            );
        }

        return $lastMessage;
    }

    protected function handleFlowGreeting(
        Conversation $conversation,
        array $flowGreeting,
    ): ConversationItem|null {
        AiAgentSession::start(
            $conversation,
            flowId: $flowGreeting['flow_id'],
            status: $flowGreeting['session_status'],
            currentNodeId: $flowGreeting['current_node_id'],
        );

        $messages = array_map(
            fn($part) => (new CreateConversationMessage())->execute(
                $conversation,
                $part,
            ),
            $flowGreeting['parts'],
        );

        return Arr::last($messages);
    }
}
