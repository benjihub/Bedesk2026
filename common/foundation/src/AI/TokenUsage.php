<?php

namespace Common\AI;

class TokenUsage
{
    public function __construct(
        public int $totalTokens,
        public int|null $promptTokens = null,
    ) {
    }
}
