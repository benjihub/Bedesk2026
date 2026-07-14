<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingPaymentRequest;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class NowPaymentsService
{
    public function createInvoice(AiBillingPaymentRequest $paymentRequest): array
    {
        $pricing = $this->invoicePricing($paymentRequest);
        $payload = $this->post('invoice', [
            'price_amount' => $pricing['priceAmount'],
            'price_currency' => strtolower($pricing['priceCurrency']),
            'pay_currency' => strtolower(
                (string) config('ai-billing.nowpayments.pay_currency'),
            ),
            'order_id' => $paymentRequest->reference,
            'order_description' => $paymentRequest->notes ?: $paymentRequest->type,
            'ipn_callback_url' => config('ai-billing.nowpayments.ipn_callback_url'),
            'success_url' => config('ai-billing.nowpayments.success_url'),
            'cancel_url' => config('ai-billing.nowpayments.cancel_url'),
        ]);

        return [
            ...$this->normalizeProviderPayload(
                $payload,
                'NOWPayments invoice created.',
            ),
            ...$pricing,
        ];
    }

    public function fetchPaymentStatus(
        AiBillingPaymentRequest $paymentRequest,
    ): array {
        $attempts = [];
        $candidateIds = array_values(
            array_unique(
                array_filter([
                    $paymentRequest->provider_payment_id,
                    $paymentRequest->provider_prepay_id,
                ]),
            ),
        );

        foreach ($candidateIds as $candidateId) {
            foreach ([
                sprintf('payment/%s', rawurlencode($candidateId)),
                sprintf('payments/%s', rawurlencode($candidateId)),
            ] as $path) {

                try {
                    $payload = $this->get($path);
                    $attempts[] = $this->lookupAttempt($path, true);

                    return $this->normalizeProviderPayload(
                        $this->payloadWithLookupAttempts($payload, $attempts),
                        'NOWPayments payment status refreshed.',
                    );
                } catch (GuzzleException $exception) {
                    $attempts[] = $this->lookupAttempt(
                        $path,
                        false,
                        $exception,
                    );
                }
            }
        }

        if ($paymentRequest->provider_prepay_id) {
            $path = sprintf(
                'invoice/%s',
                rawurlencode($paymentRequest->provider_prepay_id),
            );

            try {
                $payload = $this->get($path);
                $attempts[] = $this->lookupAttempt($path, true);

                return $this->normalizeProviderPayload(
                    $this->payloadWithLookupAttempts($payload, $attempts),
                    'NOWPayments invoice status refreshed.',
                );
            } catch (GuzzleException $exception) {
                $attempts[] = $this->lookupAttempt(
                    $path,
                    false,
                    $exception,
                );
            }
        }

        Log::warning('NOWPayments payment status lookup did not find a paid payment.', [
            'paymentRequestId' => $paymentRequest->id,
            'reference' => $paymentRequest->reference,
            'providerPaymentId' => $paymentRequest->provider_payment_id,
            'providerPrepayId' => $paymentRequest->provider_prepay_id,
            'attempts' => $attempts,
        ]);

        return [
            'verified' => false,
            'failed' => false,
            'status' => 'waiting',
            'message' => 'Waiting for NOWPayments IPN callback. NOWPayments does not allow this invoice to be refreshed with the configured API key.',
            'payload' => [
                'nowPaymentsLookup' => [
                    'attempts' => $attempts,
                ],
            ],
        ];
    }

    public function ipnSignatureIsValid(
        array $payload,
        ?string $signature,
    ): bool {
        $secret = (string) config('ai-billing.nowpayments.ipn_secret');

        if (!$secret || !$signature) {
            return false;
        }

        $expected = hash_hmac(
            'sha512',
            json_encode(
                $this->sortPayload($payload),
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            ),
            $secret,
        );

        return hash_equals(strtolower($expected), strtolower($signature));
    }

    public function normalizeProviderPayload(
        array $payload,
        string $fallbackMessage,
    ): array {
        $rawStatus = strtolower(
            (string) (
                $this->firstPayloadValue($payload, [
                    'payment_status',
                    'status',
                    'data.payment_status',
                    'data.status',
                    'payment.payment_status',
                    'payment.status',
                    'payments.0.payment_status',
                    'payments.0.status',
                ])
                ?: 'waiting'
            ),
        );
        $status = $this->normalizeStatus($rawStatus);
        $paymentId = $this->paymentId($payload);
        $invoiceId = $this->invoiceId($payload);
        $receivedAmount = $this->receivedAmount($payload);
        $checkoutUrl = $this->checkoutUrl($payload, $invoiceId);

        return [
            'verified' => $status === 'verified',
            'failed' => in_array($status, ['failed', 'expired', 'refunded'], true),
            'status' => $status,
            'rawStatus' => $rawStatus,
            'message' => $this->message($status, $fallbackMessage),
            'paymentId' => $paymentId,
            'invoiceId' => $invoiceId,
            'checkoutUrl' => $checkoutUrl,
            'invoiceUrl' => $checkoutUrl,
            'payAddress' => $this->firstPayloadValue($payload, [
                'pay_address',
                'data.pay_address',
                'payment.pay_address',
                'payments.0.pay_address',
            ]),
            'payAmount' => $this->firstPayloadValue($payload, [
                'pay_amount',
                'data.pay_amount',
                'payment.pay_amount',
                'payments.0.pay_amount',
            ]),
            'payCurrency' => $this->firstPayloadValue($payload, [
                'pay_currency',
                'data.pay_currency',
                'payment.pay_currency',
                'payments.0.pay_currency',
            ]),
            'receivedAmount' => $receivedAmount,
            'transactionHash' => $this->transactionHash($payload),
            'payload' => $payload,
        ];
    }

    public function amountAndCurrencyMatch(
        AiBillingPaymentRequest $paymentRequest,
        array $payload,
    ): bool {
        $status = $this->normalizeStatus(
            strtolower(
                (string) (
                    $this->firstPayloadValue($payload, [
                        'payment_status',
                        'status',
                        'data.payment_status',
                        'data.status',
                        'payment.payment_status',
                        'payment.status',
                        'payments.0.payment_status',
                        'payments.0.status',
                    ]) ?: ''
                ),
            ),
        );
        $orderId = $this->firstPayloadValue($payload, [
            'order_id',
            'orderId',
            'data.order_id',
            'data.orderId',
            'payment.order_id',
            'payment.orderId',
            'payments.0.order_id',
            'payments.0.orderId',
            'invoice.order_id',
            'invoice.orderId',
        ]);

        if (
            $status === 'verified' &&
            $orderId &&
            (string) $orderId === $paymentRequest->reference
        ) {
            return true;
        }

        $priceAmount = $this->firstPayloadValue($payload, [
            'price_amount',
            'data.price_amount',
            'payment.price_amount',
            'payments.0.price_amount',
        ]);
        $priceCurrency = $this->firstPayloadValue($payload, [
            'price_currency',
            'data.price_currency',
            'payment.price_currency',
            'payments.0.price_currency',
        ]);

        if (!$priceCurrency && !is_numeric($priceAmount)) {
            return true;
        }

        $expectedCurrency = $paymentRequest->currency;
        $expectedAmount = $paymentRequest->amount;
        $providerPricing = Arr::get(
            $paymentRequest->provider_payload ?: [],
            'nowPaymentsPricing',
            [],
        );

        if (
            $priceCurrency &&
            strtoupper((string) $priceCurrency) !== strtoupper($paymentRequest->currency)
        ) {
            $expectedCurrency =
                Arr::get($providerPricing, 'priceCurrency')
                ?: config('ai-billing.nowpayments.price_currency', 'USDTTRC20');
            $expectedAmount = Arr::get($providerPricing, 'priceAmount');

            if (!$expectedAmount) {
                return true;
            }
        }

        if (
            $priceCurrency &&
            strtoupper((string) $priceCurrency) !== strtoupper((string) $expectedCurrency)
        ) {
            return false;
        }

        if (is_numeric($priceAmount)) {
            return abs((float) $priceAmount - (float) $expectedAmount) < 0.01;
        }

        return true;
    }

    protected function invoicePricing(
        AiBillingPaymentRequest $paymentRequest,
    ): array {
        $priceCurrency = strtoupper(
            (string) config('ai-billing.nowpayments.price_currency', 'USDTTRC20'),
        );

        if ($priceCurrency === strtoupper($paymentRequest->currency)) {
            return [
                'priceAmount' => (string) $paymentRequest->amount,
                'priceCurrency' => $priceCurrency,
                'priceRate' => '1',
                'priceSource' => 'same_currency',
            ];
        }

        $quote = app(CryptoExchangeRateService::class)->quote(
            $paymentRequest->amount,
            $paymentRequest->currency,
            $priceCurrency,
        );

        return [
            'priceAmount' => $quote['amount'],
            'priceCurrency' => $priceCurrency,
            'priceRate' => $quote['rate'] ?? null,
            'priceSource' => $quote['source'] ?? null,
        ];
    }

    private function normalizeStatus(string $status): string
    {
        return match ($status) {
            'finished',
            'confirmed',
            'paid',
            'complete',
            'completed',
            'success',
            'successful' => 'verified',
            'failed' => 'failed',
            'expired' => 'expired',
            'refunded' => 'refunded',
            default => $status ?: 'waiting',
        };
    }

    private function message(string $status, string $fallback): string
    {
        return match ($status) {
            'verified' => 'NOWPayments payment verified.',
            'failed' => 'NOWPayments payment failed.',
            'expired' => 'NOWPayments payment expired.',
            'refunded' => 'NOWPayments payment refunded.',
            default => $fallback,
        };
    }

    private function paymentId(array $payload): ?string
    {
        $id = $this->firstPayloadValue($payload, [
            'payment_id',
            'paymentId',
            'data.payment_id',
            'data.paymentId',
            'payment.payment_id',
            'payment.paymentId',
            'payments.0.payment_id',
            'payments.0.paymentId',
        ]);

        return $id ? (string) $id : null;
    }

    private function invoiceId(array $payload): ?string
    {
        $id = $this->firstPayloadValue($payload, [
            'invoice_id',
            'invoiceId',
            'id',
            'data.invoice_id',
            'data.invoiceId',
            'data.id',
            'payment.invoice_id',
            'payment.invoiceId',
            'payment.id',
            'payments.0.invoice_id',
            'payments.0.invoiceId',
        ]);

        return $id ? (string) $id : null;
    }

    private function checkoutUrl(array $payload, ?string $invoiceId): ?string
    {
        $url = Arr::get($payload, 'invoice_url')
            ?: Arr::get($payload, 'payment_url')
            ?: Arr::get($payload, 'checkout_url')
            ?: Arr::get($payload, 'url')
            ?: Arr::get($payload, 'data.invoice_url')
            ?: Arr::get($payload, 'data.payment_url')
            ?: Arr::get($payload, 'data.checkout_url')
            ?: Arr::get($payload, 'data.url');

        if ($url) {
            return $url;
        }

        if (!$invoiceId) {
            return null;
        }

        return str_replace(
            '{id}',
            rawurlencode($invoiceId),
            config(
                'ai-billing.nowpayments.checkout_url_template',
                'https://nowpayments.io/payment/?iid={id}',
            ),
        );
    }

    private function receivedAmount(array $payload): ?string
    {
        $amount = $this->firstPayloadValue($payload, [
            'actually_paid',
            'pay_amount',
            'outcome_amount',
            'data.actually_paid',
            'data.pay_amount',
            'data.outcome_amount',
            'payment.actually_paid',
            'payment.pay_amount',
            'payment.outcome_amount',
            'payments.0.actually_paid',
            'payments.0.pay_amount',
            'payments.0.outcome_amount',
        ]);

        return $amount !== null ? (string) $amount : null;
    }

    private function transactionHash(array $payload): ?string
    {
        $hash = $this->firstPayloadValue($payload, [
            'outcome_hash',
            'payin_hash',
            'tx_hash',
            'transaction_hash',
            'data.outcome_hash',
            'data.payin_hash',
            'data.tx_hash',
            'data.transaction_hash',
            'payment.outcome_hash',
            'payment.payin_hash',
            'payment.tx_hash',
            'payment.transaction_hash',
            'payments.0.outcome_hash',
            'payments.0.payin_hash',
            'payments.0.tx_hash',
            'payments.0.transaction_hash',
        ]);

        return $hash ? (string) $hash : null;
    }

    private function matchingPaymentFromList(
        array $payload,
        AiBillingPaymentRequest $paymentRequest,
    ): ?array {
        $payments = Arr::get($payload, 'data.payments')
            ?: Arr::get($payload, 'payments')
            ?: Arr::get($payload, 'items')
            ?: Arr::get($payload, 'result.payments')
            ?: Arr::get($payload, 'result')
            ?: Arr::get($payload, 'data')
            ?: [];

        if (!is_array($payments)) {
            return null;
        }

        foreach ($payments as $payment) {
            if (!is_array($payment)) {
                continue;
            }

            $orderId = $this->firstPayloadValue($payment, [
                'order_id',
                'orderId',
                'data.order_id',
                'data.orderId',
                'invoice.order_id',
                'invoice.orderId',
            ]);

            if ($orderId && (string) $orderId === $paymentRequest->reference) {
                return $payment;
            }
        }

        return null;
    }

    private function firstPayloadValue(array $payload, array $paths): mixed
    {
        foreach ($paths as $path) {
            $value = Arr::get($payload, $path);

            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function payloadWithLookupAttempts(array $payload, array $attempts): array
    {
        return [
            ...$payload,
            'nowPaymentsLookup' => [
                'attempts' => $attempts,
            ],
        ];
    }

    private function lookupAttempt(
        string $path,
        bool $success,
        ?GuzzleException $exception = null,
    ): array {
        $attempt = [
            'path' => $path,
            'success' => $success,
        ];

        if (!$exception) {
            return $attempt;
        }

        $attempt['error'] = $exception->getMessage();

        if ($exception instanceof RequestException && $exception->hasResponse()) {
            $response = $exception->getResponse();
            $attempt['httpStatus'] = $response?->getStatusCode();
            $attempt['body'] = mb_substr(
                (string) $response?->getBody(),
                0,
                500,
            );
        }

        return $attempt;
    }

    protected function post(string $path, array $body): array
    {
        $response = $this->client()->post($path, [
            'headers' => $this->headers(),
            'json' => $body,
        ]);

        return json_decode((string) $response->getBody(), true) ?: [];
    }

    protected function get(string $path, array $query = []): array
    {
        $response = $this->client()->get($path, [
            'headers' => $this->headers(),
            'query' => $query,
        ]);

        return json_decode((string) $response->getBody(), true) ?: [];
    }

    private function client(): Client
    {
        return new Client([
            'base_uri' => rtrim(config('ai-billing.nowpayments.api_base_url'), '/') . '/',
            'timeout' => config('ai-billing.nowpayments.timeout', 30),
        ]);
    }

    private function headers(): array
    {
        $apiKey = config('ai-billing.nowpayments.api_key');

        if (!$apiKey) {
            throw new RuntimeException('NOWPayments API key is not configured.');
        }

        return [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'x-api-key' => $apiKey,
        ];
    }

    private function sortPayload(array $payload): array
    {
        ksort($payload);

        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                $payload[$key] = $this->sortPayload($value);
            }
        }

        return $payload;
    }
}
