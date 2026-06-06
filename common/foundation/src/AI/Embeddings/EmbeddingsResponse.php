<?php

namespace Common\AI\Embeddings;

use Common\AI\TokenUsage;
use Illuminate\Support\Collection;

class EmbeddingsResponse
{
    public function __construct(
        public Collection $embeddings,
        public TokenUsage $usage,
    ) {
    }
}
