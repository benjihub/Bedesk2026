<?php

namespace Common\AI\Providers\OpenAI;

use Common\AI\Providers\BasePrismProvider;
use Prism\Prism\Enums\Provider;

class PrismOpenAIProvider extends BasePrismProvider
{
    protected Provider $provider = Provider::OpenAI;
    protected string $defaultEmbeddingModel = 'text-embedding-3-small';
    protected string $defaultTextModel = 'gpt-4o-mini';

    protected function getDefaultTextModel(): string
    {
        if (config('services.openai.text_model')) {
            return config('services.openai.text_model');
        }

        return $this->defaultTextModel;
    }
}
