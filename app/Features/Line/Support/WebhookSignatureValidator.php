<?php

namespace App\Features\Line\Support;

class WebhookSignatureValidator
{
    public function isValid(string $payload, ?string $signatureHeader): bool
    {
        $secret = config('line.webhook_secret');
        if (!$secret || !$signatureHeader) {
            return false;
        }

        $signature = trim($signatureHeader);

        $expected = base64_encode(hash_hmac('sha256', $payload, $secret, true));
        return hash_equals($expected, $signature);
    }
}
