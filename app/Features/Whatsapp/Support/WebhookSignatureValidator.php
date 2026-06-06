<?php

namespace App\Features\Whatsapp\Support;

class WebhookSignatureValidator
{
    public function isValid(string $payload, ?string $signatureHeader): bool
    {
        $secret = config('whatsapp.app_secret');
        if (!$secret || !$signatureHeader) {
            return false;
        }

        $signatureHeader = trim($signatureHeader);
        $signature = $signatureHeader;
        if (str_starts_with($signatureHeader, 'sha256=')) {
            $signature = substr($signatureHeader, 7);
        }

        $expected = hash_hmac('sha256', $payload, $secret);
        return hash_equals($expected, $signature);
    }
}
