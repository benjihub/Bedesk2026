<?php

namespace Common\AI\Providers\OpenAI\Handlers;

use Common\AI\Providers\OpenAI\Concerns\BuildsClient;
use Common\AI\Providers\OpenAI\Concerns\UsesResponsesApi;
use Common\AI\Providers\ProviderParams;

class TextStream
{
    use UsesResponsesApi, BuildsClient;

    protected array $requestParams;

    protected $currentStep = 0;

    public function __construct(protected ProviderParams $providerParams)
    {
        $this->requestParams = $this->buildRequestParams($this->providerParams);
    }

    public function generate()
    {
        $stream = $this->getClient()
            ->responses()
            ->createStreamed($this->requestParams);
        $finalToolCalls = [];

        // either handle tool calls or stream regular message
        foreach ($stream as $chunk) {
            if (
                $chunk->event === 'response.output_item.added' &&
                $chunk->response->item->type === 'function_call'
            ) {
                $index = $chunk->response->outputIndex;
                if (!isset($finalToolCalls[$index])) {
                    $finalToolCalls[$index] = [
                        'id' => $chunk->response->item->id,
                        'callId' => $chunk->response->item->callId,
                        'name' => $chunk->response->item->name,
                        'arguments' => $chunk->response->item->arguments,
                    ];
                }

                $finalToolCalls[$index]['arguments'] .=
                    $chunk->response->item->arguments;
            } elseif (
                $chunk->event === 'response.function_call_arguments.delta'
            ) {
                $index = $chunk->response->outputIndex;
                if (isset($finalToolCalls[$index])) {
                    $finalToolCalls[$index]['arguments'] .=
                        $chunk->response->delta;
                }
            } elseif ($chunk->event === 'response.output_text.delta') {
                if (
                    $chunk->event === 'response.output_text.delta' &&
                    $chunk->response->delta
                ) {
                    yield $chunk->response->delta;
                }

                if (connection_aborted()) {
                    break;
                }
            }
        }

        $this->currentStep++;

        // handle tool calls recursively, up to specified max steps
        if (
            !empty($finalToolCalls) &&
            $this->currentStep <= $this->providerParams->maxSteps
        ) {
            $toolMessages = $this->handleToolCalls(
                $finalToolCalls,
                $this->providerParams,
            );

            $this->requestParams['input'] = [
                ...$this->requestParams['input'],
                ...$toolMessages,
            ];

            yield from $this->generate();
        }
    }
}
