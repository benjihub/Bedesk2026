<?php

namespace Common\AI\Images;

use Common\AI\TokenUsage;

class GenerateImageResponse
{
    public function __construct(
        public string $url,
        public string $size,
        public string $revisedPrompt,
        public TokenUsage $usage,
    ) {
    }
}
