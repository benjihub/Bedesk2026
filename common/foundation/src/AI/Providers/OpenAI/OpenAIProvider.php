<?php

namespace Common\AI\Providers\OpenAI;

use OpenAI\Exceptions\ErrorException;
use Common\AI\Embeddings\EmbeddingsResponse;
use Common\AI\Exceptions\LlmException;
use Common\AI\Images\GenerateImageResponse;
use Common\AI\Providers\BaseProvider;
use Common\AI\Providers\OpenAI\Handlers\Embeddings;
use Common\AI\Providers\OpenAI\Handlers\Image;
use Common\AI\Providers\OpenAI\Handlers\Text;
use Common\AI\Providers\ProviderContract;
use Common\AI\Providers\OpenAI\Handlers\TextStream;
use Common\AI\Providers\ProviderParams;
use Common\AI\Text\TextResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;

class OpenAIProvider extends BaseProvider
{
    public function generateText(): TextResponse
    {
        try {
            return (new Text($this->params))->generate();
        } catch (ErrorException $e) {
            $e->getErrorType() === 'insufficient_quota'
                ? throw LlmException::quotaExceeded()
                : throw LlmException::generic($e->getMessage());
        }
    }

    public function generateEmbeddings(
        string|Collection $input,
    ): EmbeddingsResponse {
        return (new Embeddings())->generate(
            input: $input,
            model: $this->params->model,
        );
    }

    public function generateImage(array $data): GenerateImageResponse
    {
        return (new Image())->generate(
            prompt: $this->params->systemPrompt,
            data: $data,
            model: $this->params->model,
        );
    }

    public function generateTextStream(): LazyCollection
    {
        return new LazyCollection(function () {
            yield from (new TextStream($this->params))->generate();
        });
    }
}
