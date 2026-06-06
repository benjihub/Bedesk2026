<?php

namespace Common\AI\Providers\Gemini;

use Common\AI\Embeddings\EmbeddingsResponse;
use Common\AI\Providers\BasePrismProvider;
use Common\AI\TokenUsage;
use Illuminate\Support\Collection;
use Prism\Prism\Embeddings\PendingRequest as PendingEmbeddingsRequest;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Prism;

class PrismGeminiProvider extends BasePrismProvider
{
    protected Provider $provider = Provider::Gemini;
    protected string $defaultEmbeddingModel = 'gemini-embedding-001';
    protected string $defaultTextModel = 'gemini-2.5-flash';

    protected function getDefaultTextModel(): string
    {
        if (config('services.gemini.text_model')) {
            return config('services.gemini.text_model');
        }

        return $this->defaultTextModel;
    }

    public function generateEmbeddings(
        string|Collection $input,
    ): EmbeddingsResponse {
        $embeddings = collect($input)->map(function (string $item) {
            $request = Prism::embeddings()
                ->using(
                    $this->provider,
                    $this->params->model ?? $this->defaultEmbeddingModel,
                )
                ->fromInput($item);

            $this->modifyEmbeddingsRequest($request);

            $response = $request->asEmbeddings();

            return [
                'embedding' => $this->normalizeEmbedding(
                    $response->embeddings[0]->embedding,
                ),
                'totalTokens' => $response->usage->tokens ?? 0,
            ];
        });

        return new EmbeddingsResponse(
            embeddings: $embeddings->pluck('embedding'),
            usage: new TokenUsage(
                totalTokens: $embeddings->pluck('totalTokens')->sum(),
            ),
        );
    }

    protected function modifyEmbeddingsRequest(
        PendingEmbeddingsRequest $request,
    ): void {
        $request->withProviderOptions([
            'taskType' => 'RETRIEVAL_DOCUMENT',
            'outputDimensionality' => 1536,
        ]);
    }
    function normalizeEmbedding(array $embeddingValues): array
    {
        $sumSquares = 0.0;
        foreach ($embeddingValues as $v) {
            $sumSquares += $v * $v;
        }
        $norm = sqrt($sumSquares);

        if ($norm == 0) {
            return $embeddingValues;
        }

        return array_map(fn($v) => $v / $norm, $embeddingValues);
    }
}
