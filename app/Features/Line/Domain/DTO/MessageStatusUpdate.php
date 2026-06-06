<?php

namespace App\Features\Line\Domain\DTO;

class MessageStatusUpdate
{
    public function __construct(
        public readonly string $providerMessageId,
        public readonly string $status,
        public readonly ?string $timestamp,
        public readonly ?string $recipientId,
        public readonly array $raw,
    ) {
    }
}
