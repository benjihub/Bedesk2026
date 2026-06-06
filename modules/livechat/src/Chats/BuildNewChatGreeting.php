<?php

namespace Livechat\Chats;

use Ai\AiAgent\Flows\MessageBuilderData;
use Ai\AiAgent\Flows\Nodes\NodeType;
use Ai\AiAgent\Flows\SessionContext;
use Ai\AiAgent\Models\AiAgentFlow;
use Ai\AiAgent\Models\AiAgentSession;
use App\Conversations\Models\Conversation;
use App\Conversations\Traits\BuildsConversationResources;
use App\Models\User;
use Common\Files\FileEntry;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use App\Core\WidgetFlags;

class BuildNewChatGreeting
{
    use BuildsConversationResources;

    protected bool $aiAgentEnabled;

    public function __construct(
        protected User $user,
        protected int|null $flowId = null,
    ) {
        $this->aiAgentEnabled =
            settings('aiAgent.enabled') || $this->isFlowPreview();
    }

    public function execute(): array
    {
        $aiAgent = settings('aiAgent');

        if ($this->aiAgentEnabled || $this->flowId) {
            $flowIds = Arr::get($aiAgent, 'basicGreeting.flowIds');
            $basicMessage = Arr::get($aiAgent, 'basicGreeting.message');

            // flow as greeting
            if (
                Arr::get($aiAgent, 'greetingType') === 'flow' ||
                $this->flowId
            ) {
                $flow = AiAgentFlow::query()->find(
                    $this->flowId ?? Arr::get($aiAgent, 'initialFlowId'),
                );
                if ($flow) {
                    $flowGreetings = $this->buildGrettingFromFlow($flow);

                    if (!empty($flowGreetings['parts'])) {
                        return $flowGreetings;
                    }
                }
            }

            // basic greeting
            if (
                Arr::get($aiAgent, 'greetingType') === 'basicGreeting' &&
                ($basicMessage || $flowIds)
            ) {
                $basicGreeting = $this->buildBasicGreeting(
                    $basicMessage,
                    $flowIds,
                );
                if (!empty($basicGreeting)) {
                    return $basicGreeting;
                }
            }
        }

        // build default greeting from settings, if nothing else is available, or AI agent disabled
        $baseMessage =
            settings('chatWidget.defaultMessage') ??
            __('Welcome! How can we help you today?');

        return [
            'parts' => [$this->buildBasicMessagePart($baseMessage)],
        ];
    }

    protected function buildBasicGreeting(
        string|null $basicMessage = '',
        array|null $flowIds = [],
    ): array {
        $flows = empty($flowIds)
            ? collect()
            : AiAgentFlow::query()
                ->select(['id', 'name'])
                ->whereIn('id', $flowIds)
                ->get();

        $data = $flows->isEmpty()
            ? null
            : [
                'buttons' => $flows
                    ->map(
                        fn(AiAgentFlow $flow) => [
                            'id' => $flow->id,
                            'name' => $flow->name,
                        ],
                    )
                    ->toArray(),
            ];

        return [
            'parts' => [$this->buildBasicMessagePart($basicMessage, $data)],
        ];
    }

    protected function buildBasicMessagePart(
        string $body,
        array|null $data = null,
    ): array {
        $uuid = Str::uuid();
        return [
            'id' => $uuid,
            'uuid' => $uuid,
            'author' => $this->getAuthor(),
            'type' => 'message',
            'created_at' => now()->toJSON(),
            'body' => $body,
            'data' => $data,
        ];
    }

    protected function buildGrettingFromFlow(AiAgentFlow $flow): array
    {
        $allNodes = $flow->config['nodes'];
        $welcomeNodes = collect([]);

        $currentNodeConfig = Arr::first(
            $allNodes,
            fn($node) => ($node['parentId'] ?? null) === 'start',
        );
        $sessionStatus = AiAgentSession::STATUS_ACTIVE;

        $index = 0;
        while ($currentNodeConfig) {
            $index++;
            $node = (NodeType::tryFrom($currentNodeConfig['type']) ?? NodeType::unknown)->getNode();

            if ($node::$canUseAsGreetingNode) {
                $data = new MessageBuilderData(
                    nodeConfig: $currentNodeConfig,
                    allNodes: $allNodes,
                    user: $this->user,
                );
                $welcomeNodes = $welcomeNodes->merge(
                    $this->nodeToFeedContentItems($data, $index),
                );

                // break here so currentNodeConfig is not updated
                if ($node::$waitsForUserInput) {
                    $sessionStatus =
                        AiAgentSession::STATUS_WAITING_FOR_USER_INPUT;
                    break;
                }
            } else {
                break;
            }

            $currentNodeConfig = Arr::first(
                $allNodes,
                fn($node) => ($node['parentId'] ?? null) === ($currentNodeConfig['id'] ?? null),
            );
        }

        $attachmentIds = $welcomeNodes
            ->pluck('attachments')
            ->flatten()
            ->unique();

        // replace attachment ids with actual attachments
        if (!$attachmentIds->isEmpty()) {
            $atachments = $this->buildAttachmentList(
                FileEntry::whereIn('id', $attachmentIds)->get(),
            );
            $welcomeNodes = $welcomeNodes->map(
                fn($node) => [
                    ...$node,
                    'attachments' => array_map(
                        fn($attachmentId) => Arr::first(
                            $atachments,
                            fn($attachment) => $attachment['id'] ===
                                $attachmentId,
                        ),
                        $node['attachments'] ?? [],
                    ),
                ],
            );
        }

        if ($welcomeNodes->isEmpty() && $this->isFlowPreview()) {
            $welcomeNodes->push(
                $this->buildBasicMessagePart(
                    __(
                        'This flow has no greeting nodes, type any message to simulate execution of flow.',
                    ),
                    [
                        'buttons' => [
                            [
                                'id' => 'execute',
                                'name' => __('Execute now'),
                            ],
                        ],
                    ],
                ),
            );
        }

        return [
            'parts' => $welcomeNodes->toArray(),
            'flow_id' => $flow->id,
            'session_status' => $sessionStatus,
            'current_node_id' => $currentNodeConfig['id'] ?? null,
        ];
    }

    protected function nodeToFeedContentItems(
        MessageBuilderData $data,
        int $index,
    ): array {
        $node = (NodeType::tryFrom($data->nodeConfig['type']) ?? NodeType::unknown)->getNode();
        $messages = $node::buildConversationMessagesData($data);

        return array_map(function ($messageData) use ($index) {
            $uuid = Str::uuid();
            return [
                'id' => $uuid,
                'uuid' => $uuid,
                'author' => $this->getAuthor(),
                // make sure created_at is not the same for all nodes
                'created_at' => now()->addSeconds($index)->toJSON(),
                ...$messageData,
            ];
        }, $messages);
    }

    protected function getAuthor(): string
    {
        return $this->aiAgentEnabled
            ? Conversation::AUTHOR_BOT
            : Conversation::AUTHOR_SYSTEM;
    }

    protected function isFlowPreview(): bool
    {
        return WidgetFlags::isAiAgentPreviewMode() ||
            str_contains(request()->url(), 'ai-agent-preview-mode');
    }
}
