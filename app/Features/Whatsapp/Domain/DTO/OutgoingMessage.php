<?php

namespace App\Features\Whatsapp\Domain\DTO;

class OutgoingMessage
{
    public function __construct(
        public readonly string $to,
        public readonly string $type,
        public readonly ?string $body,
        public readonly ?int $accountId,
        public readonly bool $previewUrl,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function fromArray(array $payload): self
    {
        return new self(
            to: $payload['to'],
            type: $payload['type'],
            body: $payload['body'] ?? null,
            accountId: $payload['account_id'] ?? null,
            previewUrl: (bool) ($payload['preview_url'] ?? false),
        );
    }
}
