<?php namespace App\Billing\Services;

use GuzzleHttp\Client;
use RuntimeException;

class CryptoExchangeRateService
{
    public function quote(
        int $fiatAmount,
        string $fiatCurrency,
        string $cryptoAsset,
    ): array {
        if (strtoupper($fiatCurrency) === strtoupper($cryptoAsset)) {
            return [
                'amount' => $this->formatAmount($fiatAmount),
                'asset' => strtoupper($cryptoAsset),
                'rate' => '1',
                'source' => 'same_currency',
            ];
        }

        $rate = $this->fetchRate($fiatCurrency, $cryptoAsset);
        if ($rate <= 0) {
            throw new RuntimeException('Exchange rate must be greater than zero.');
        }

        $direction = config(
            'ai-billing.exchange_rate.direction',
            'fiat_per_crypto',
        );

        $cryptoAmount =
            $direction === 'crypto_per_fiat'
                ? $fiatAmount * $rate
                : $fiatAmount / $rate;

        return [
            'amount' => $this->formatAmount($cryptoAmount),
            'asset' => strtoupper($cryptoAsset),
            'rate' => (string) $rate,
            'source' => config('ai-billing.exchange_rate.url'),
        ];
    }

    private function fetchRate(string $fiatCurrency, string $cryptoAsset): float
    {
        $url = strtr(config('ai-billing.exchange_rate.url'), [
            '{fiat}' => strtoupper($fiatCurrency),
            '{asset}' => strtoupper($cryptoAsset),
        ]);

        if (!$url) {
            throw new RuntimeException('Exchange rate URL is not configured.');
        }

        $client = new Client([
            'timeout' => config('ai-billing.exchange_rate.timeout', 10),
        ]);
        $response = $client->get($url);
        $payload = json_decode((string) $response->getBody(), true) ?: [];
        $rate = data_get(
            $payload,
            config('ai-billing.exchange_rate.json_path', 'price'),
        );

        if (!is_numeric($rate)) {
            throw new RuntimeException('Exchange rate response did not include a numeric rate.');
        }

        return (float) $rate;
    }

    private function formatAmount(float|int $amount): string
    {
        $decimals = config('ai-billing.exchange_rate.decimals', 8);

        return rtrim(rtrim(number_format($amount, $decimals, '.', ''), '0'), '.');
    }
}
