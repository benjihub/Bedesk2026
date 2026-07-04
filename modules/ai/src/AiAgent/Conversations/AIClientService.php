<?php

namespace Ai\AiAgent\Conversations;

use Ai\AiAgent\Models\AiAgent;
use Ai\AiAgent\Models\AiAgentActivityLog;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class AIClientService
{
    /**
     * Calls OpenAI Chat Completions and returns the assistant text.
     *
     * If $context is provided, the call is recorded to ai_agent_activity_logs
     * so Status metrics (requests/tokens/success/response time) can be computed.
     *
     * Expected $context keys (all optional):
     * - conversation_id: int
     * - group_id: int|null
     * - agent_name: string
     * - ai_agent_id: int|null
     */
    public function callOpenAiChatCompletion(
        array $messages,
        float $temperature,
        int $maxTokens,
        ?array $context = null,
    ): string
    {
        $apiKey = config('services.openai.api_key') ?? env('OPENAI_API_KEY');
        $model = config('services.openai.text_model')
            ?? env('OPENAI_TEXT_MODEL')
            ?? env('OPENAI_MODEL')
            ?? 'gpt-3.5-turbo';

        if (!$apiKey) {
            Log::warning('OpenAI is not configured (missing OPENAI_API_KEY).');
            $this->recordActivity($context, [
                'status' => 'error',
                'error_message' => 'Missing OpenAI API key',
                'response_time_ms' => 0,
                'prompt_tokens' => null,
                'completion_tokens' => null,
                'total_tokens' => null,
            ]);
            return '';
        }

        $startedAt = microtime(true);

        try {
            $client = new Client(['timeout' => 30]);
            $resp = $client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => $temperature,
                    'max_tokens' => $maxTokens,
                ],
            ]);

            $body = json_decode((string) $resp->getBody(), true);
            $text = $body['choices'][0]['message']['content'] ?? null;
            $usage = is_array($body['usage'] ?? null) ? $body['usage'] : [];

            $finalText = is_string($text) ? trim($text) : '';
            $status = $finalText !== '' ? 'success' : 'error';
            $errorMessage = $finalText !== '' ? null : 'OpenAI response missing content';

            $this->recordActivity($context, [
                'status' => $status,
                'error_message' => $errorMessage,
                'response_time_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'prompt_tokens' => isset($usage['prompt_tokens']) ? (int) $usage['prompt_tokens'] : null,
                'completion_tokens' => isset($usage['completion_tokens']) ? (int) $usage['completion_tokens'] : null,
                'total_tokens' => isset($usage['total_tokens']) ? (int) $usage['total_tokens'] : null,
            ]);

            return $finalText;
        } catch (\Throwable $e) {
            Log::error('OpenAI call failed: ' . $e->getMessage());
            $this->recordActivity($context, [
                'status' => 'error',
                'error_message' => $e->getMessage(),
                'response_time_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'prompt_tokens' => null,
                'completion_tokens' => null,
                'total_tokens' => null,
            ]);
            return '';
        }
    }

    private function recordActivity(?array $context, array $result): void
    {
        if (!$context) {
            return;
        }
        if (!Schema::hasTable('ai_agent_activity_logs')) {
            return;
        }

        $conversationId = $context['conversation_id'] ?? null;
        if (!is_numeric($conversationId)) {
            return;
        }

        $agentName = $context['agent_name'] ?? null;
        if (!is_string($agentName) || trim($agentName) === '') {
            return;
        }

        $groupId = $context['group_id'] ?? null;
        $groupId = is_numeric($groupId) ? (int) $groupId : null;

        $aiAgentId = $context['ai_agent_id'] ?? null;
        $aiAgentId = is_numeric($aiAgentId) ? (int) $aiAgentId : null;

        if (!$aiAgentId) {
            $aiAgentId = $this->resolveAiAgentId($groupId, $agentName);
        }

        try {
            AiAgentActivityLog::create([
                'group_id' => $groupId,
                'ai_agent_id' => $aiAgentId,
                'conversation_id' => (int) $conversationId,
                'agent_name' => $agentName,
                'status' => $result['status'] ?? 'success',
                'response_time_ms' => $result['response_time_ms'] ?? null,
                'prompt_tokens' => $result['prompt_tokens'] ?? null,
                'completion_tokens' => $result['completion_tokens'] ?? null,
                'total_tokens' => $result['total_tokens'] ?? null,
                'error_message' => $result['error_message'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to record AI agent activity: ' . $e->getMessage());
        }
    }

    private function resolveAiAgentId(?int $groupId, string $agentName): ?int
    {
        try {
            $query = AiAgent::query()->where('name', $agentName);

            if ($groupId) {
                $query->where(function ($inner) use ($groupId) {
                    $inner->whereNull('group_id')->orWhere('group_id', $groupId);
                })->orderByRaw('CASE WHEN group_id = ? THEN 0 ELSE 1 END', [$groupId]);
            } else {
                $query->whereNull('group_id');
            }

            $agent = $query->first();
            return $agent?->id ? (int) $agent->id : null;
        } catch (\Throwable $_) {
            return null;
        }
    }
}
