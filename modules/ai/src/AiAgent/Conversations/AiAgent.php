<?php

namespace Ai\AiAgent\Conversations;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Events\ConversationMessageCreated;
use App\Billing\Services\AiBillingAccountResolver;
use App\Billing\Services\AiReplyQuotaService;
use Ai\AiAgent\Models\AiAgent as AiAgentRecord;
use Ai\AiAgent\Models\AiAgentActivityLog;
use Ai\AiAgent\Models\AiAgentFlow;
use Ai\AiAgent\Models\AiAgentSession;
use Ai\AiAgent\Conversations\Streaming\EventEmitter;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Team\Models\GroupAiAgentSettings;
use GuzzleHttp\Client;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal flow executor for AI agent conversations.
 * - Loads/creates an `AiAgentSession` for the conversation
 * - Loads an `AiAgentFlow` (from settings or the first flow)
 * - Supports simple node types: `start`, `message`, `tool`, `llm`
 * - Moves from node to node using `data.next` or `next` field
 * - Generates responses via OpenAI (if `OPENAI_API_KEY` present) or a fallback
 */
class AiAgent
{
    protected Conversation $conversation;

    protected ?array $resolvedAiAgentSettings = null;

    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation;
    }

    public function handleLatestUserMessage(): void
    {
        // load latest user message
        $latest = $this->conversation->latestMessage()->first();
        if (! $latest) return;

        if (($latest->author ?? null) !== Conversation::AUTHOR_USER) {
            return; // only react to user messages
        }

        // load or create session
        $session = $this->conversation->aiAgentSession()->first();
        if (! $session) {
            $session = AiAgentSession::create([
                'conversation_id' => $this->conversation->id,
                'context' => [],
            ]);
        }

        // Prefer flow pinned to this conversation session (e.g. selected in widget preview or greeting)
        $sessionFlowId = null;
        if (is_array($session->context ?? null)) {
            $sessionFlowId = $session->context['flow_id'] ?? null;
        }

        $groupId = $this->conversation->group_id ? (int) $this->conversation->group_id : null;

        // choose flow: session pin -> settings -> first scoped flow
        $initialFlowId = $this->getAiAgentSetting('initialFlowId');

        $flow = null;
        if ($sessionFlowId) {
            $flow = $this->findScopedFlow((int) $sessionFlowId, $groupId);
        }
        if (! $flow && $initialFlowId) {
            $flow = $this->findScopedFlow((int) $initialFlowId, $groupId);
        }
        if (! $flow) {
            $flow = $this->firstScopedFlow($groupId);
        }

        // If no flows defined, reply directly via LLM (or fallback if not configured)
        if (! $flow) {
            $reply = $this->respondWithOpenAi(
                $latest->body ?? '',
                $this->getSystemPrompt(),
            );
            $this->createBotMessage($reply);
            return;
        }

        $config = $flow->config ?? ['nodes' => []];
        $nodes = $config['nodes'] ?? [];

        // find current node from session, or start node
        $currentNodeId = $session->context['current_node_id'] ?? null;

        if (! $currentNodeId) {
            foreach ($nodes as $n) {
                $type = $n['type'] ?? ($n->type ?? null);
                if ($type === 'start') {
                    $currentNodeId = $n['id'] ?? null;
                    break;
                }
            }
        }

        // If flow is malformed (no start node), reply directly via LLM (or fallback)
        if (! $currentNodeId) {
            $reply = $this->respondWithOpenAi(
                $latest->body ?? '',
                $this->getSystemPrompt(),
            );
            $this->createBotMessage($reply);
            return;
        }

        // Execute nodes in sequence (with safety cap)
        $safety = 0;
        $maxSteps = 12;
        $nextNodeId = $currentNodeId;

        while ($nextNodeId && $safety++ < $maxSteps) {
            $node = $this->findNodeById($nodes, $nextNodeId);
            if (! $node) break;

            $type = $node['type'] ?? null;
            $data = $node['data'] ?? [];

            switch ($type) {
                case 'message':
                    $text = $this->extractMessageText($data);
                    if ($text) {
                        $this->createBotMessage($text);
                    }
                    $nextNodeId = $this->getNextNodeId($node, $data);
                    break;

                case 'llm':
                case 'tool':
                    // If configured, call OpenAI for llm nodes or run a tool for tool nodes
                    if ($type === 'llm' || ($type === 'tool' && ($data['tool'] ?? '') === 'llm')) {
                        $prompt = $data['prompt'] ?? ($data['message'] ?? ($latest->body ?? ''));
                        $systemPrompt = $data['systemPrompt'] ?? $this->getSystemPrompt();

                        // SSE stream lifecycle is controlled by the controller.
                        // Here we only emit typing + deltas + messageCreated.
                        $this->emitTypingIndicator();
                        $response = $this->respondWithOpenAi($prompt, $systemPrompt);
                        // emit as delta (single chunk for now)
                        EventEmitter::delta($response);

                        $this->createBotMessage($response);
                    } else {
                        $result = $this->executeToolNode($node, $latest, $session);
                        if (is_string($result) && $result !== '') {
                            $this->createBotMessage($result);
                        }
                    }
                    $nextNodeId = $this->getNextNodeId($node, $data);
                    break;

                case 'buttons':
                    // collect child button items
                    $buttons = array_filter($nodes, fn($n) => ($n['parentId'] ?? $n['parentId'] ?? null) === ($node['id'] ?? null) && ($n['type'] ?? null) === 'buttonsItem');
                    $items = array_map(fn($b) => ['id' => $b['id'] ?? null, 'label' => $b['data']['name'] ?? $b['data']['label'] ?? null], $buttons);
                    $this->emitTypingIndicator();

                    $this->createBotMessagePayload([
                        'body' => $data['message'] ?? null,
                        'data' => ['buttons' => $items],
                    ]);
                    $nextNodeId = $this->getNextNodeId($node, $data);
                    break;

                case 'branches':
                    // evaluate simple branches: look at children and match by name/value in data
                    $matched = null;
                    $children = array_filter($nodes, fn($n) => ($n['parentId'] ?? null) === ($node['id'] ?? null));
                    $lastText = mb_strtolower($latest->body ?? '');
                    foreach ($children as $ch) {
                        $cond = $ch['data']['condition'] ?? $ch['data']['name'] ?? null;
                        if (!$cond) continue;
                        if (is_string($cond) && $cond !== '' && str_contains($lastText, mb_strtolower((string)$cond))) {
                            $matched = $ch;
                            break;
                        }
                    }
                    if ($matched) {
                        $nextNodeId = $this->getNextNodeId($matched, $matched['data'] ?? []);
                    } else {
                        $nextNodeId = $this->getNextNodeId($node, $data);
                    }
                    break;

                case 'transfer':
                    // Inform user and transfer to human agents
                    $text = $data['message'] ?? 'Transferring you to an agent...';
                    $this->emitTypingIndicator();

                    $message = $this->createBotMessagePayload([
                        'body' => $text,
                    ]);

                    if ($message) {
                        $this->conversation->assigned_to = Conversation::ASSIGNED_AGENT;
                        $this->conversation->ai_agent_involved = false;
                        $this->conversation->save();
                    }

                    // attempt to assign to an available agent
                    try {
                        ConversationsAssigner::assignConversationToFirstAvailableAgent($this->conversation);
                    } catch (\Throwable $e) {
                        Log::warning('Failed to auto-assign conversation during transfer: '.$e->getMessage());
                    }

                    $nextNodeId = null; // stop execution after transfer
                    break;

                case 'start':
                    // start node usually just points to next
                    $nextNodeId = $this->getNextNodeId($node, $data);
                    break;

                default:
                    // unknown node - stop
                    $nextNodeId = null;
                    break;
            }

        }

        // persist last node into session context
        $session->context = array_merge($session->context ?? [], ['current_node_id' => $nextNodeId]);
        $session->save();
    }

    protected function emitTypingIndicator(): void
    {
        if (EventEmitter::isStreaming()) {
            EventEmitter::typing();
        }
    }

    protected function getSystemPrompt(): ?string
    {
        $personality = $this->getAiAgentSetting('personality');

        if (!is_string($personality)) {
            return null;
        }

        $personality = trim($personality);
        return $personality !== '' ? $personality : null;
    }

    protected function getAiAgentSetting(string $key)
    {
        $settings = $this->getResolvedAiAgentSettings();
        return $settings[$key] ?? null;
    }

    protected function getResolvedAiAgentSettings(): array
    {
        if (is_array($this->resolvedAiAgentSettings)) {
            return $this->resolvedAiAgentSettings;
        }

        $default = [
            'name' => 'AI assistant',
            'image' => null,
            'enabled' => true,
            'personality' => '',
            'greetingType' => 'basicGreeting',
            'initialFlowId' => null,
            'basicGreeting' => [
                'message' => 'Hello! How can I help you today?',
                'flowIds' => [],
            ],
            'transfer' => [
                'type' => 'basicTransfer',
                'instruction' => null,
            ],
            'cantAssist' => [
                'instruction' => null,
            ],
        ];

        try {
            $global = settings('aiAgent') ?? [];
        } catch (\Throwable $e) {
            $global = [];
        }
        if (!is_array($global)) {
            $global = [];
        }

        $overrides = [];
        $groupId = $this->conversation->group_id;
        if ($groupId) {
            $record = GroupAiAgentSettings::query()
                ->where('group_id', $groupId)
                ->first();
            $overrides = $record?->overrides ?? [];
            if (!is_array($overrides)) {
                $overrides = [];
            }
        }

        $this->resolvedAiAgentSettings = array_replace_recursive(
            $default,
            $global,
            $overrides,
        );

        return $this->resolvedAiAgentSettings;
    }

    protected function findNodeById(array $nodes, $id): ?array
    {
        foreach ($nodes as $n) {
            if (($n['id'] ?? null) == $id) return $n;
        }
        return null;
    }

    protected function getNextNodeId(array $node, $data): ?string
    {
        // common shapes: data.next, node.next
        if (is_array($data) && !empty($data['next'])) return $data['next'];
        if (!empty($node['next'])) return $node['next'];
        return null;
    }

    protected function findScopedFlow(int $flowId, ?int $groupId): ?AiAgentFlow
    {
        $query = AiAgentFlow::query()->where('id', $flowId);

        if ($groupId) {
            $query->where(function ($inner) use ($groupId) {
                $inner->whereNull('group_id')->orWhere('group_id', $groupId);
            })->orderByRaw('CASE WHEN group_id = ? THEN 0 ELSE 1 END', [$groupId]);
        } else {
            $query->whereNull('group_id');
        }

        return $query->first();
    }

    protected function firstScopedFlow(?int $groupId): ?AiAgentFlow
    {
        $query = AiAgentFlow::query();

        if ($groupId) {
            $query
                ->where(function ($inner) use ($groupId) {
                    $inner->whereNull('group_id')->orWhere('group_id', $groupId);
                })
                ->orderByRaw('CASE WHEN group_id = ? THEN 0 ELSE 1 END', [$groupId]);
        } else {
            $query->whereNull('group_id');
        }

        return $query->orderByDesc('id')->first();
    }

    protected function extractMessageText($data): ?string
    {
        if (is_array($data)) {
            return $data['message'] ?? $data['body'] ?? $data['text'] ?? null;
        }
        return is_string($data) ? $data : null;
    }

    protected function createBotMessage(string $body): ?ConversationItem
    {
        return $this->createBotMessagePayload(['body' => $body]);
    }

    protected function createBotMessagePayload(array $payload): ?ConversationItem
    {
        try {
            if (!$this->canConsumeAiReplyCredit()) {
                Log::warning('AI reply quota reached; bot message blocked.', [
                    'conversation_id' => $this->conversation->id,
                ]);
                return null;
            }

            $this->emitTypingIndicator();

            $message = (new CreateConversationMessage())->execute(
                $this->conversation,
                array_merge(
                    [
                        'type' => 'message',
                        'author' => Conversation::AUTHOR_BOT,
                    ],
                    $payload,
                ),
            );

            event(new ConversationMessageCreated($this->conversation, $message));

            if (EventEmitter::isStreaming()) {
                EventEmitter::messageCreated($message->toArray());
            }

            $this->recordAiReplyCredit($message);

            return $message;
        } catch (\Throwable $e) {
            Log::error('Failed to persist bot message: '.$e->getMessage());
            return null;
        }
    }

    protected function canConsumeAiReplyCredit(): bool
    {
        if (! Schema::hasTable('ai_billing_accounts')) {
            return true;
        }

        try {
            $account = app(AiBillingAccountResolver::class)->resolve();
            return app(AiReplyQuotaService::class)->canConsume($account);
        } catch (\Throwable $e) {
            Log::warning('AI billing quota check failed: '.$e->getMessage());
            return true;
        }
    }

    protected function recordAiReplyCredit(ConversationItem $message): void
    {
        if (! Schema::hasTable('ai_billing_accounts')) {
            return;
        }

        try {
            $groupId = $this->conversation->group_id ? (int) $this->conversation->group_id : null;
            $agentName = (string) ($this->getAiAgentSetting('name') ?: 'AI assistant');
            $agent = $this->resolveCurrentAiAgentRecord($groupId, $agentName);
            $account = app(AiBillingAccountResolver::class)->resolve();

            app(AiReplyQuotaService::class)->recordSuccessfulReply($account, [
                'conversation_id' => $this->conversation->id,
                'ai_agent_id' => $agent?->id,
                'message_id' => $message->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to record AI reply billing usage: '.$e->getMessage());
        }
    }

    protected function generateFallbackResponse(string $input): string
    {
        // very small rule-based fallback
        $lower = mb_strtolower($input);
        if (str_contains($lower, 'order')) {
            return 'I can help with orders — can you provide your order number?';
        }
        if (str_contains($lower, 'price') || str_contains($lower, 'cost')) {
            return 'Pricing depends on your plan — can you share more details?';
        }
        return "Thanks for your message. An agent will respond shortly.";
    }

    protected function executeToolNode(array $node, $latest, AiAgentSession $session)
    {
        // Minimal stub: honor a few simple tools (e.g., echo, extract)
        $data = $node['data'] ?? [];
        $tool = $data['tool'] ?? ($data['name'] ?? null);

        switch ($tool) {
            case 'echo':
                return $data['text'] ?? 'echo';
            case 'extract_last_message':
                return $latest->body ?? '';
            default:
                return '[tool: not implemented]';
        }
    }

    protected function respondWithOpenAi(string $prompt, ?string $systemPrompt = null): string
    {
        $result = $this->callOpenAi($prompt, $systemPrompt);
        $this->recordAiAgentActivity($result);

        return $result['text'];
    }

    protected function callOpenAi(string $prompt, ?string $systemPrompt = null): array
    {
        $startedAt = microtime(true);
        // Prefer Laravel config so it works reliably with config cache.
        $apiKey = config('services.openai.api_key')
            ?? env('OPENAI_API_KEY');

        $model = config('services.openai.text_model')
            ?? env('OPENAI_TEXT_MODEL')
            ?? env('OPENAI_MODEL')
            ?? 'gpt-3.5-turbo';

        if (! $apiKey) {
            Log::warning('OpenAI is not configured (missing OPENAI_API_KEY).');
            return [
                'text' => $this->generateFallbackResponse($prompt),
                'status' => 'error',
                'error_message' => 'Missing OpenAI API key',
                'response_time_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'prompt_tokens' => null,
                'completion_tokens' => null,
                'total_tokens' => null,
            ];
        }

        try {
            $messages = [];
            if (is_string($systemPrompt) && trim($systemPrompt) !== '') {
                $messages[] = [
                    'role' => 'system',
                    'content' => trim($systemPrompt),
                ];
            }
            $messages[] = [
                'role' => 'user',
                'content' => $prompt,
            ];

            $client = new Client(['timeout' => 30]);
            $resp = $client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer '.$apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $model,
                    'messages' => $messages,
                    'max_tokens' => 256,
                ],
            ]);

            $body = json_decode((string) $resp->getBody(), true);
            $text = $body['choices'][0]['message']['content'] ?? null;
            $usage = is_array($body['usage'] ?? null) ? $body['usage'] : [];
            $finalText = is_string($text) ? trim($text) : $this->generateFallbackResponse($prompt);

            return [
                'text' => $finalText,
                'status' => is_string($text) ? 'success' : 'error',
                'error_message' => is_string($text) ? null : 'OpenAI response missing content',
                'response_time_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'prompt_tokens' => isset($usage['prompt_tokens']) ? (int) $usage['prompt_tokens'] : null,
                'completion_tokens' => isset($usage['completion_tokens']) ? (int) $usage['completion_tokens'] : null,
                'total_tokens' => isset($usage['total_tokens']) ? (int) $usage['total_tokens'] : null,
            ];
        } catch (\Throwable $e) {
            Log::error('OpenAI call failed: '.$e->getMessage());
            return [
                'text' => $this->generateFallbackResponse($prompt),
                'status' => 'error',
                'error_message' => $e->getMessage(),
                'response_time_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'prompt_tokens' => null,
                'completion_tokens' => null,
                'total_tokens' => null,
            ];
        }
    }

    protected function recordAiAgentActivity(array $result): void
    {
        if (! Schema::hasTable('ai_agent_activity_logs')) {
            return;
        }

        try {
            $groupId = $this->conversation->group_id ? (int) $this->conversation->group_id : null;
            $agentName = (string) ($this->getAiAgentSetting('name') ?: 'AI assistant');
            $agent = $this->resolveCurrentAiAgentRecord($groupId, $agentName);
            $agentName = $agent?->name ?? $agentName;

            AiAgentActivityLog::create([
                'group_id' => $groupId,
                'ai_agent_id' => $agent?->id,
                'conversation_id' => $this->conversation->id,
                'agent_name' => $agentName,
                'status' => $result['status'] ?? 'success',
                'response_time_ms' => $result['response_time_ms'] ?? null,
                'prompt_tokens' => $result['prompt_tokens'] ?? null,
                'completion_tokens' => $result['completion_tokens'] ?? null,
                'total_tokens' => $result['total_tokens'] ?? null,
                'error_message' => $result['error_message'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to record AI agent activity: '.$e->getMessage());
        }
    }

    protected function resolveCurrentAiAgentRecord(?int $groupId, string $agentName): ?AiAgentRecord
    {
        try {
            $session = $this->conversation->aiAgentSession()->first();
            $context = is_array($session?->context ?? null) ? $session->context : [];
            $pinnedAgentId = $context['ai_agent_id'] ?? null;

            if (is_numeric($pinnedAgentId)) {
                $agent = AiAgentRecord::query()
                    ->where('id', (int) $pinnedAgentId)
                    ->where(function ($query) use ($groupId) {
                        if ($groupId) {
                            $query->whereNull('group_id')->orWhere('group_id', $groupId);
                        } else {
                            $query->whereNull('group_id');
                        }
                    })
                    ->first();

                if ($agent) {
                    return $agent;
                }
            }
        } catch (\Throwable $_) {
            // Fall back to name-based resolution below.
        }

        $query = AiAgentRecord::query()->where('name', $agentName);

        if ($groupId) {
            $query->where(function ($inner) use ($groupId) {
                $inner->whereNull('group_id')->orWhere('group_id', $groupId);
            })->orderByRaw('CASE WHEN group_id = ? THEN 0 ELSE 1 END', [$groupId]);
        } else {
            $query->whereNull('group_id');
        }

        return $query->first();
    }
}
