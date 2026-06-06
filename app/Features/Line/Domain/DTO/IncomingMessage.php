<?php

namespace App\Features\Line\Domain\DTO;

class IncomingMessage
{
    public function __construct(
        public readonly string $providerMessageId,
        public readonly string $from,
        public readonly ?string $to,
        public readonly string $type,
        public readonly ?string $body,
        public readonly ?string $timestamp,
        public readonly ?string $contactName,
        public readonly ?string $contactId,
        public readonly array $raw,
    ) {
    }
}
