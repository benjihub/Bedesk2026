<?php

namespace Common\AI\Providers\Anthropic;

use Common\AI\Providers\BasePrismProvider;
use Prism\Prism\Enums\Provider;

class PrismAnthropicProvider extends BasePrismProvider
{
    protected Provider $provider = Provider::Anthropic;
    protected string $defaultEmbeddingModel = 'text-embedding-3-small';
    protected string $defaultTextModel = 'claude-sonnet-4-0';

    protected function getDefaultTextModel(): string
    {
        if (config('services.anthropic.text_model')) {
            return config('services.anthropic.text_model');
        }

        return $this->defaultTextModel;
    }
}
