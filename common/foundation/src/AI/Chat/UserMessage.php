<?php

namespace Common\AI\Chat;

use Prism\Prism\ValueObjects\Messages\UserMessage as PrismUserMessage;

class UserMessage extends PrismUserMessage
{
    public function __construct(public readonly string $content) {}
}
