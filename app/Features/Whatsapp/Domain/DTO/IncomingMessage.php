<?php

namespace App\Features\Whatsapp\Domain\DTO;

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
        public readonly ?string $contactWaId,
        public readonly array $raw,
    ) {
    }
}
