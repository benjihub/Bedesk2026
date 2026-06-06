<?php

namespace Common\AI\Providers\OpenRouter;

use Common\AI\Providers\BasePrismProvider;
use Prism\Prism\Enums\Provider;

class PrismOpenRouterProvider extends BasePrismProvider
{
    protected Provider $provider = Provider::OpenRouter;
    protected string $defaultEmbeddingModel = 'text-embedding-3-small';
    protected string $defaultTextModel = 'gpt-4o-mini';

    protected function getDefaultTextModel(): string
    {
        if (config('services.openrouter.text_model')) {
            return config('services.openrouter.text_model');
        }

        return $this->defaultTextModel;
    }
}
