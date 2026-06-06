<?php

namespace Common\AI\Exceptions;

class LlmException extends \Exception
{
    const QUOTA_EXCEEDED = 1;

    const GENERIC = 2;

    public static function quotaExceeded(): self
    {
        return new self('Quota exceeded', self::QUOTA_EXCEEDED);
    }

    public static function generic(string $message): self
    {
        return new self($message, self::GENERIC);
    }
}
