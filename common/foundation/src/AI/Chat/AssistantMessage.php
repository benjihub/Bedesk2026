<?php

namespace Common\AI\Chat;

use Prism\Prism\ValueObjects\Messages\AssistantMessage as PrismAssistantMessage;

class AssistantMessage extends PrismAssistantMessage
{
    public function __construct(public readonly string $content) {}
}
