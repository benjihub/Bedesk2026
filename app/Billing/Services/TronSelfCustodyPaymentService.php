<?php namespace App\Billing\Services;

use App\Billing\Models\AiBillingPaymentRequest;
use GuzzleHttp\Client;
use Illuminate\Support\Arr;
use Throwable;

class TronSelfCustodyPaymentService
{
    private const TRANSFER_METHOD_ID = 'a9059cbb';

    public function findPayment(AiBillingPaymentRequest $paymentRequest): array
    {
        if (!$paymentRequest->wallet_address) {
            return $this->result(false, 'wallet_not_configured', 'Billing wallet address is not configured.');
        }

        try {
            $transfers = $this->incomingTrc20Transfers($paymentRequest);
        } catch (Throwable $e) {
            return $this->result(false, 'scan_failed', $e->getMessage());
        }

        $decimals = (int) config('ai-billing.tron.usdt_decimals', 6);
        $expectedUnits = $this->decimalToUnits(
            (string) $paymentRequest->expected_crypto_amount,
            $decimals,
        );

        foreach ($transfers as $transfer) {
            $hash = (string) (
                Arr::get($transfer, 'transaction_id')
                ?: Arr::get($transfer, 'transactionId')
                ?: Arr::get($transfer, 'txID')
            );
            $amountUnits = (string) Arr::get($transfer, 'value', '');

            if (!$hash || !$amountUnits) {
                continue;
            }

            if ($this->transactionHashIsReusedHash($hash, $paymentRequest->id)) {
                continue;
            }

            if (!$this->transferTimeMatchesRequest($paymentRequest, $transfer)) {
                continue;
            }

            if (!$this->transferRecipientMatchesWallet($paymentRequest, $transfer)) {
                continue;
            }

            if (!$this->transferTokenMatchesUsdt($transfer)) {
                continue;
            }

            if ($this->compareIntegerStrings($amountUnits, $expectedUnits) !== 0) {
                continue;
            }

            return $this->result(
                true,
                'verified',
                'TRON payment automatically detected and verified.',
                $transfer,
                [
                    'receivedAmount' => $this->unitsToDecimal($amountUnits, $decimals),
                    'transactionHash' => $hash,
                ],
            );
        }

        return $this->result(
            false,
            'awaiting_payment',
            'No matching TRC20 payment has been detected yet.',
            ['checkedTransfers' => count($transfers)],
        );
    }

    public function verify(AiBillingPaymentRequest $paymentRequest): array
    {
        $hash = trim((string) $paymentRequest->transaction_hash);

        if (!$hash) {
            return $this->result(false, 'awaiting_transaction', 'Transaction hash is missing.');
        }

        if ($this->transactionHashIsReusedHash($hash, $paymentRequest->id)) {
            return $this->result(false, 'duplicate_transaction', 'This transaction hash is already linked to another payment.');
        }

        try {
            $transaction = $this->post('/wallet/gettransactionbyid', [
                'value' => $hash,
            ]);
        } catch (Throwable $e) {
            return $this->result(false, 'verification_failed', $e->getMessage());
        }

        if (!Arr::get($transaction, 'txID')) {
            return $this->result(false, 'transaction_not_found', 'Transaction was not found on TRON.');
        }

        if (!$this->transactionSucceeded($transaction)) {
            return $this->result(false, 'transaction_failed', 'TRON transaction did not complete successfully.', $transaction);
        }

        $transfer = $this->extractTransfer($transaction);

        if (!$transfer) {
            return $this->result(false, 'not_usdt_transfer', 'Transaction is not a USDT TRC20 transfer.', $transaction);
        }

        try {
            $expectedContract = $this->addressToHex(
                config('ai-billing.tron.usdt_contract_hex')
                    ?: config('ai-billing.tron.usdt_contract'),
            );
        } catch (Throwable $e) {
            return $this->result(false, 'token_contract_not_configured', $e->getMessage(), $transaction);
        }

        if (strtoupper($transfer['contract']) !== strtoupper($expectedContract)) {
            return $this->result(false, 'wrong_token', 'Transaction token contract is not USDT TRC20.', $transaction);
        }

        if (!$paymentRequest->wallet_address) {
            return $this->result(false, 'wallet_not_configured', 'Billing wallet address is not configured.', $transaction);
        }

        try {
            $expectedWallet = $this->addressToHex((string) $paymentRequest->wallet_address);
        } catch (Throwable $e) {
            return $this->result(false, 'wallet_not_configured', $e->getMessage(), $transaction);
        }

        if (strtoupper($transfer['recipient']) !== strtoupper($expectedWallet)) {
            return $this->result(false, 'wrong_wallet', 'Transaction was not sent to the billing wallet.', $transaction);
        }

        if (!$this->transactionTimeMatchesRequest($paymentRequest, $transaction)) {
            return $this->result(false, 'outside_payment_window', 'Transaction time does not match this payment request window.', $transaction);
        }

        $decimals = (int) config('ai-billing.tron.usdt_decimals', 6);
        $expectedUnits = $this->decimalToUnits(
            (string) $paymentRequest->expected_crypto_amount,
            $decimals,
        );

        $receivedAmount = $this->unitsToDecimal(
            $transfer['amountUnits'],
            $decimals,
        );

        if ($this->compareIntegerStrings($transfer['amountUnits'], $expectedUnits) !== 0) {
            return $this->result(
                false,
                'amount_mismatch',
                'Transaction amount does not match the exact USDT amount for this payment request.',
                $transaction,
                [
                    'expectedAmount' => (string) $paymentRequest->expected_crypto_amount,
                    'receivedAmount' => $receivedAmount,
                ],
            );
        }

        return $this->result(true, 'verified', 'TRON payment verified.', $transaction, [
            'receivedAmount' => $receivedAmount,
            'transactionHash' => $hash,
            'recipientHex' => $transfer['recipient'],
            'contractHex' => $transfer['contract'],
        ]);
    }

    private function extractTransfer(array $transaction): ?array
    {
        $contract = Arr::get($transaction, 'raw_data.contract.0');

        if (Arr::get($contract, 'type') !== 'TriggerSmartContract') {
            return null;
        }

        $value = Arr::get($contract, 'parameter.value', []);
        $data = strtolower((string) Arr::get($value, 'data'));

        if (!str_starts_with($data, self::TRANSFER_METHOD_ID)) {
            return null;
        }

        $arguments = substr($data, strlen(self::TRANSFER_METHOD_ID));
        $recipientArgument = substr($arguments, 0, 64);
        $amountArgument = substr($arguments, 64, 64);

        if (strlen($recipientArgument) !== 64 || strlen($amountArgument) !== 64) {
            return null;
        }

        return [
            'contract' => strtoupper((string) Arr::get($value, 'contract_address')),
            'recipient' => strtoupper('41' . substr($recipientArgument, -40)),
            'amountUnits' => $this->hexToDecimalString($amountArgument),
        ];
    }

    private function transactionSucceeded(array $transaction): bool
    {
        $result = strtoupper((string) Arr::get($transaction, 'ret.0.contractRet'));

        return !$result || $result === 'SUCCESS';
    }

    private function transactionTimeMatchesRequest(
        AiBillingPaymentRequest $paymentRequest,
        array $transaction,
    ): bool {
        $timestamp = (int) Arr::get($transaction, 'raw_data.timestamp');

        if (!$timestamp) {
            return true;
        }

        $transactionTime = (int) floor($timestamp / 1000);
        $createdAt = $paymentRequest->created_at?->getTimestamp();
        $expiresAt = $paymentRequest->expires_at?->getTimestamp();

        if ($createdAt && $transactionTime < $createdAt) {
            return false;
        }

        if ($expiresAt && $transactionTime > $expiresAt) {
            return false;
        }

        return true;
    }

    private function transactionHashIsReusedHash(
        string $transactionHash,
        int $paymentRequestId,
    ): bool {
        return AiBillingPaymentRequest::where(
            'transaction_hash',
            $transactionHash,
        )
            ->where('id', '!=', $paymentRequestId)
            ->whereIn('status', ['pending', 'paid'])
            ->exists();
    }

    private function incomingTrc20Transfers(
        AiBillingPaymentRequest $paymentRequest,
    ): array {
        $params = [
            'limit' => (int) config('ai-billing.tron.scan_limit', 200),
            'only_to' => 'true',
            'contract_address' => config('ai-billing.tron.usdt_contract'),
            'order_by' => 'block_timestamp,desc',
        ];

        if ($paymentRequest->created_at) {
            $params['min_timestamp'] = $paymentRequest->created_at->getTimestamp() * 1000;
        }

        if ($paymentRequest->expires_at) {
            $params['max_timestamp'] = $paymentRequest->expires_at->getTimestamp() * 1000;
        }

        $response = $this->get(
            sprintf(
                '/v1/accounts/%s/transactions/trc20',
                rawurlencode((string) $paymentRequest->wallet_address),
            ),
            $params,
        );

        return Arr::get($response, 'data', []);
    }

    private function transferTimeMatchesRequest(
        AiBillingPaymentRequest $paymentRequest,
        array $transfer,
    ): bool {
        $timestamp = (int) Arr::get($transfer, 'block_timestamp');

        if (!$timestamp) {
            return true;
        }

        $transferTime = (int) floor($timestamp / 1000);
        $createdAt = $paymentRequest->created_at?->getTimestamp();
        $expiresAt = $paymentRequest->expires_at?->getTimestamp();

        if ($createdAt && $transferTime < $createdAt) {
            return false;
        }

        if ($expiresAt && $transferTime > $expiresAt) {
            return false;
        }

        return true;
    }

    private function transferRecipientMatchesWallet(
        AiBillingPaymentRequest $paymentRequest,
        array $transfer,
    ): bool {
        $recipient = (string) Arr::get($transfer, 'to');

        if (!$recipient) {
            return false;
        }

        return $this->addressesMatch(
            $recipient,
            (string) $paymentRequest->wallet_address,
        );
    }

    private function transferTokenMatchesUsdt(array $transfer): bool
    {
        $contract = (string) Arr::get($transfer, 'token_info.address');

        if (!$contract) {
            return true;
        }

        return $this->addressesMatch(
            $contract,
            (string) config('ai-billing.tron.usdt_contract'),
        );
    }

    private function addressesMatch(string $left, string $right): bool
    {
        try {
            return strtoupper($this->addressToHex($left)) ===
                strtoupper($this->addressToHex($right));
        } catch (Throwable) {
            return strtolower(trim($left)) === strtolower(trim($right));
        }
    }

    private function post(string $path, array $body): array
    {
        $headers = ['Content-Type' => 'application/json'];
        $apiKey = config('ai-billing.tron.api_key');

        if ($apiKey) {
            $headers['TRON-PRO-API-KEY'] = $apiKey;
        }

        $client = new Client([
            'base_uri' => rtrim(config('ai-billing.tron.api_base_url'), '/'),
            'timeout' => 30,
        ]);

        $response = $client->post($path, [
            'headers' => $headers,
            'json' => $body,
        ]);

        return json_decode((string) $response->getBody(), true) ?: [];
    }

    private function get(string $path, array $query = []): array
    {
        $headers = ['Accept' => 'application/json'];
        $apiKey = config('ai-billing.tron.api_key');

        if ($apiKey) {
            $headers['TRON-PRO-API-KEY'] = $apiKey;
        }

        $client = new Client([
            'base_uri' => rtrim(config('ai-billing.tron.api_base_url'), '/'),
            'timeout' => 30,
        ]);

        $response = $client->get($path, [
            'headers' => $headers,
            'query' => $query,
        ]);

        return json_decode((string) $response->getBody(), true) ?: [];
    }

    private function result(
        bool $verified,
        string $status,
        string $message,
        array $payload = [],
        array $extra = [],
    ): array {
        return [
            ...$extra,
            'verified' => $verified,
            'status' => $status,
            'message' => $message,
            'payload' => $payload,
        ];
    }

    private function addressToHex(string $address): string
    {
        $address = trim($address);

        if (preg_match('/^41[0-9a-f]{40}$/i', $address)) {
            return strtoupper($address);
        }

        $decoded = $this->base58CheckDecode($address);

        return strtoupper(bin2hex($decoded));
    }

    private function base58CheckDecode(string $input): string
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        $bytes = [0];

        foreach (str_split($input) as $char) {
            $carry = strpos($alphabet, $char);

            if ($carry === false) {
                throw new \InvalidArgumentException('Invalid TRON address.');
            }

            for ($i = count($bytes) - 1; $i >= 0; $i--) {
                $carry += $bytes[$i] * 58;
                $bytes[$i] = $carry & 0xff;
                $carry >>= 8;
            }

            while ($carry > 0) {
                array_unshift($bytes, $carry & 0xff);
                $carry >>= 8;
            }
        }

        foreach (str_split($input) as $char) {
            if ($char !== '1') {
                break;
            }

            array_unshift($bytes, 0);
        }

        $decoded = pack('C*', ...$bytes);

        if (strlen($decoded) !== 25) {
            throw new \InvalidArgumentException('Invalid TRON address length.');
        }

        $payload = substr($decoded, 0, -4);
        $checksum = substr($decoded, -4);
        $expected = substr(hash('sha256', hash('sha256', $payload, true), true), 0, 4);

        if (!hash_equals($expected, $checksum)) {
            throw new \InvalidArgumentException('Invalid TRON address checksum.');
        }

        return $payload;
    }

    private function decimalToUnits(string $amount, int $decimals): string
    {
        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '');
        $whole = preg_replace('/\D/', '', $whole) ?: '0';
        $fraction = substr(str_pad(preg_replace('/\D/', '', $fraction), $decimals, '0'), 0, $decimals);

        return ltrim($whole . $fraction, '0') ?: '0';
    }

    private function unitsToDecimal(string $units, int $decimals): string
    {
        $units = ltrim($units, '0') ?: '0';
        $units = str_pad($units, $decimals + 1, '0', STR_PAD_LEFT);
        $whole = substr($units, 0, -$decimals);
        $fraction = rtrim(substr($units, -$decimals), '0');

        return $fraction ? "{$whole}.{$fraction}" : $whole;
    }

    private function hexToDecimalString(string $hex): string
    {
        $decimal = '0';

        foreach (str_split(ltrim($hex, '0') ?: '0') as $digit) {
            $decimal = $this->decimalStringMultiply($decimal, 16);
            $decimal = $this->decimalStringAdd($decimal, hexdec($digit));
        }

        return $decimal;
    }

    private function decimalStringMultiply(string $value, int $multiplier): string
    {
        $carry = 0;
        $result = '';

        for ($i = strlen($value) - 1; $i >= 0; $i--) {
            $product = ((int) $value[$i] * $multiplier) + $carry;
            $result = ($product % 10) . $result;
            $carry = intdiv($product, 10);
        }

        while ($carry > 0) {
            $result = ($carry % 10) . $result;
            $carry = intdiv($carry, 10);
        }

        return ltrim($result, '0') ?: '0';
    }

    private function decimalStringAdd(string $value, int $addend): string
    {
        $carry = $addend;
        $result = '';

        for ($i = strlen($value) - 1; $i >= 0; $i--) {
            $sum = (int) $value[$i] + ($carry % 10);
            $carry = intdiv($carry, 10);

            if ($sum >= 10) {
                $sum -= 10;
                $carry++;
            }

            $result = $sum . $result;
        }

        while ($carry > 0) {
            $result = ($carry % 10) . $result;
            $carry = intdiv($carry, 10);
        }

        return ltrim($result, '0') ?: '0';
    }

    private function compareIntegerStrings(string $left, string $right): int
    {
        $left = ltrim($left, '0') ?: '0';
        $right = ltrim($right, '0') ?: '0';

        if (strlen($left) !== strlen($right)) {
            return strlen($left) <=> strlen($right);
        }

        return $left <=> $right;
    }
}
