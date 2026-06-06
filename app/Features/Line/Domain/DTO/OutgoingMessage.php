<?php

namespace App\Features\Line\Domain\DTO;

class OutgoingMessage
{
    public function __construct(
        public readonly string $to,
        public readonly string $type,
        public readonly ?string $body,
        public readonly ?int $accountId,
        public readonly bool $previewUrl = false,
        public readonly ?string $originalContentUrl = null,
        public readonly ?string $previewImageUrl = null,
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
            originalContentUrl: $payload['original_content_url'] ??
                $payload['originalContentUrl'] ??
                null,
            previewImageUrl: $payload['preview_image_url'] ??
                $payload['previewImageUrl'] ??
                null,
        );
    }
}
