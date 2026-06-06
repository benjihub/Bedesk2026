<?php

namespace Common\AI\Providers\OpenAI\Handlers;

use Common\AI\Providers\OpenAI\Concerns\BuildsClient;
use Common\AI\Providers\OpenAI\Concerns\UsesResponsesApi;
use Common\AI\Providers\ProviderParams;
use Common\AI\Text\TextResponse;
use Common\AI\TokenUsage;

class Text
{
    use UsesResponsesApi, BuildsClient;

    protected array $requestParams;

    protected $currentStep = 0;

    public function __construct(protected ProviderParams $providerParams)
    {
        $this->requestParams = $this->buildRequestParams($this->providerParams);
    }

    public function generate(): TextResponse|null
    {
        $response = $this->getClient()
            ->responses()
            ->create($this->requestParams);

        if ($response->output[0]->type === 'function_call') {
            $toolCalls = array_map(
                fn($toolCall) => [
                    'id' => $toolCall->id,
                    'callId' => $toolCall->callId,
                    'name' => $toolCall->name,
                    'arguments' => $toolCall->arguments,
                ],
                $response->output,
            );
        }

        $this->currentStep++;

        // handle tool calls recursively, up to specified max steps
        if (
            !empty($toolCalls) &&
            $this->currentStep <= $this->providerParams->maxSteps
        ) {
            $toolMessages = $this->handleToolCalls(
                $toolCalls,
                $this->providerParams,
            );

            $this->requestParams['input'] = [
                ...$this->requestParams['input'],
                ...$toolMessages,
            ];

            $this->generate();
        } else {
            return new TextResponse(
                $response->outputText,
                null,
                new TokenUsage(
                    $response->usage->totalTokens,
                    $response->usage->inputTokens,
                ),
            );
        }

        return null;
    }
}
