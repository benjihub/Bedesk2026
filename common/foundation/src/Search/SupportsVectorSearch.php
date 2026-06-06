<?php

namespace Common\Search;

use Ai\AiAgent\Models\AiAgentVector;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Meilisearch\Endpoints\Indexes;

trait SupportsVectorSearch
{
    abstract public function getVectorDimensions(): int;

    public function vector()
    {
        return $this->belongsTo(AiAgentVector::class);
    }

    public static function searchUsingVector(
        array $vector,
        int $limit = 5,
        string|null $distinctAttribute = null,
        array|null $categoryIds = [],
    ): Collection {
        return static::search(null, function ($index) use (
            $vector,
            $limit,
            $distinctAttribute,
            $categoryIds,
        ) {
            if ($index instanceof Indexes) {
                $options = [
                    'limit' => $limit,
                    'vector' => $vector,
                    'showRankingScore' => true,
                    'rankingScoreThreshold' => 0.7,
                    'filter' => !empty($categoryIds)
                        ? 'category_ids IN [' . implode(',', $categoryIds) . ']'
                        : null,
                    'hybrid' => [
                        'semanticRatio' => 1,
                        'embedder' => static::MODEL_TYPE,
                    ],
                ];

                if ($distinctAttribute) {
                    $options['distinct'] = $distinctAttribute;
                }

                return collect($index->search(null, $options)->getHits())->map(
                    function ($hit) {
                        $hit['score'] = $hit['_rankingScore'];
                        unset($hit['_rankingScore']);
                        return $hit;
                    },
                );
            }

            // engine does not have support for vector search, fallback to brute force comparing all vectors
            $distinctValues = [];
            return static::with('vector')
                ->whereNotNull('vector_id')
                ->orderBy((new static())->getQualifiedKeyName())
                ->limit(2000)
                ->chunkMap(
                    fn($model) => [
                        ...Arr::except($model->toArray(), ['vector']),
                        'score' => static::cosineSimilarity(
                            $vector,
                            json_decode($model->vector->vector, true),
                        ),
                    ],
                    100,
                )
                ->filter(function ($model) use (
                    $distinctAttribute,
                    $distinctValues,
                ) {
                    if (
                        !$distinctAttribute ||
                        is_null($model[$distinctAttribute])
                    ) {
                        return true;
                    }

                    if (
                        !in_array($model[$distinctAttribute], $distinctValues)
                    ) {
                        $distinctValues[] = $model[$distinctAttribute];
                        return true;
                    }

                    return false;
                })
                ->sortByDesc('score')
                ->where('score', '>', 0.5)
                ->values();
        })
            ->raw()
            ->take($limit);
    }

    public static function cosineSimilarity(
        array $vector1,
        array $vector2,
    ): ?float {
        // Ensure both vectors are non-empty and have the same dimensions
        if (count($vector1) !== count($vector2) || count($vector1) === 0) {
            return null;
        }

        // Calculate dot product and magnitudes of both vectors
        $dotProduct = 0.0;
        $magnitude1 = 0.0;
        $magnitude2 = 0.0;

        for ($i = 0; $i < count($vector1); $i++) {
            $dotProduct += $vector1[$i] * $vector2[$i];
            $magnitude1 += $vector1[$i] ** 2;
            $magnitude2 += $vector2[$i] ** 2;
        }

        // Avoid division by zero by checking magnitudes
        if ($magnitude1 == 0 || $magnitude2 == 0) {
            return null;
        }

        // Calculate cosine similarity
        return $dotProduct / (sqrt($magnitude1) * sqrt($magnitude2));
    }
}
