<?php

namespace Common\AI\Providers\OpenAI\Concerns;

use Common\AI\Chat\AssistantMessage;
use Common\AI\Chat\UserMessage;
use Common\AI\Providers\ProviderParams;
use Common\AI\Tools\BaseTool;
use Illuminate\Support\Str;

trait UsesResponsesApi
{
    protected function handleToolCalls(
        array $toolCalls,
        ProviderParams $providerParams,
    ) {
        foreach ($toolCalls as $call) {
            $messages[] = [
                'id' => $call['id'],
                'call_id' => $call['callId'],
                'type' => 'function_call',
                'name' => $call['name'],
                'arguments' => $call['arguments'],
            ];
            $messages[] = [
                'type' => 'function_call_output',
                'call_id' => $call['callId'],
                'output' => $providerParams->tools
                    ->firstWhere(
                        fn(BaseTool $tool) => Str::snake($tool->name) ===
                            Str::snake($call['name']),
                    )
                    ->execute(json_decode($call['arguments'], true)),
            ];
        }

        return $messages;
    }

    protected function buildRequestParams(ProviderParams $providerParams): array
    {
        $requestParams = [
            'metadata' => [
                'app_name' => config('app.name'),
            ],
            'temperature' => $providerParams->temperature ?? 0.5,
            'max_output_tokens' => $providerParams->maxTokens ?? 2000,
            'model' => $providerParams->model ?? 'gpt-4o-mini',
            'store' => true,
        ];

        if ($providerParams->systemPrompt) {
            $requestParams['instructions'] = $providerParams->systemPrompt;
        }

        if ($providerParams->messages) {
            $requestParams['input'] = $providerParams->messages
                ->values()
                ->map(
                    fn(AssistantMessage|UserMessage $message) => [
                        'role' =>
                            $message instanceof AssistantMessage
                                ? 'assistant'
                                : 'user',
                        'content' => $message->content,
                    ],
                )
                ->toArray();
        }

        if ($providerParams->schema) {
            $requestParams['text']['format'] = [
                'type' => 'json_schema',
                'name' => $providerParams->schema['name'],
                'strict' => true,
                'schema' => $providerParams->schema['schema'],
            ];
        }

        if ($providerParams->tools?->isNotEmpty()) {
            $requestParams['tools'] = $providerParams->tools
                ->map(function (BaseTool $tool) {
                    $params = collect($tool->getParams());
                    $required = $params
                        ->filter(fn($param) => $param['required'] ?? true)
                        ->keys()
                        ->toArray();
                    return [
                        'type' => 'function',
                        'name' => strtolower(
                            str_replace(' ', '_', $tool->name),
                        ),
                        'description' => $tool->description,
                        'strict' => true,
                        'parameters' => $tool->getParams()
                            ? [
                                'type' => 'object',
                                'properties' => $params->toArray(),
                                'required' => $required,
                                'additionalProperties' => false,
                            ]
                            : null,
                    ];
                })
                ->toArray();
        }

        return $requestParams;
    }
}
