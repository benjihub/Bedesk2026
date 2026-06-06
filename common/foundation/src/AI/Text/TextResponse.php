<?php

namespace Common\AI\Text;

use Common\AI\TokenUsage;

class TextResponse
{
    public function __construct(
        public string $output,
        public string|null $finishReason,
        public TokenUsage $usage,
    ) {}
}
