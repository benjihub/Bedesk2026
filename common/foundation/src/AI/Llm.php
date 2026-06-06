<?php

namespace Common\AI;

use Common\AI\Providers\Anthropic\PrismAnthropicProvider;
use Common\AI\Providers\BasePrismProvider;
use Common\AI\Providers\BaseProvider;
use Common\AI\Providers\Gemini\PrismGeminiProvider;
use Common\AI\Providers\LlmProvider;
use Common\AI\Providers\OpenAI\PrismOpenAIProvider;
use Common\AI\Providers\OpenRouter\PrismOpenRouterProvider;
use Common\AI\Providers\ProviderParams;
use Common\AI\Text\EnhanceTextWithAIPrompts;
use Common\AI\Text\TextResponse;

class Llm
{
    public static function resolveProvider(
        ProviderParams|null $params = null,
        LlmProvider|null $provider = null,
    ): BaseProvider {
        if (!$provider) {
            $provider = LlmProvider::from(config('services.llm_provider'));
        }

        return match ($provider) {
            LlmProvider::OpenAI => new PrismOpenAIProvider($params),
            LlmProvider::Anthropic => new PrismAnthropicProvider($params),
            LlmProvider::Gemini => new PrismGeminiProvider($params),
            LlmProvider::OpenRouter => new PrismOpenRouterProvider($params),
        };
    }

    public static function resolveEmbeddingProvider(
        ProviderParams|null $params = null,
        LlmProvider|null $provider = null,
    ): BasePrismProvider {
        if (!$provider) {
            $provider = LlmProvider::from(
                config('services.embeddings_provider'),
            );
        }

        return match ($provider) {
            LlmProvider::OpenAI => new PrismOpenAIProvider($params),
            LlmProvider::Gemini => new PrismGeminiProvider($params),
        };
    }

    public static function enhanceText(
        array $data,
        string|null $provider = null,
    ): TextResponse {
        $prompts = EnhanceTextWithAIPrompts::get($data);
        return Llm::resolveProvider(
            new ProviderParams(
                systemPrompt: $prompts['system'],
                prompt: $prompts['user'],
                temperature: 0.7,
                maxTokens: 2000,
            ),
            $provider,
        )->generateText();
    }
}
