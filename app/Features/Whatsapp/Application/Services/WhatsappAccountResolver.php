<?php

namespace App\Features\Whatsapp\Application\Services;

use App\Features\Whatsapp\Models\WhatsappAccount;

class WhatsappAccountResolver
{
    public function resolve(?int $accountId): ?WhatsappAccount
    {
        if ($accountId) {
            $account = WhatsappAccount::find($accountId);
            if ($account) {
                return $this->refreshFromConfigIfMatches($account);
            }
        }

        $default = WhatsappAccount::where('is_default', true)->first();
        if ($default) {
            return $this->refreshFromConfigIfMatches($default);
        }

        return $this->resolveFromConfig();
    }

    public function resolveByPhoneNumberId(?string $phoneNumberId): ?WhatsappAccount
    {
        if ($phoneNumberId) {
            $account = WhatsappAccount::where(
                'phone_number_id',
                $phoneNumberId,
            )->first();
            if ($account) {
                return $this->refreshFromConfigIfMatches($account);
            }
        }

        $default = WhatsappAccount::where('is_default', true)->first();
        if ($default) {
            return $this->refreshFromConfigIfMatches($default);
        }

        return $this->resolveFromConfig();
    }

    protected function refreshFromConfigIfMatches(
        WhatsappAccount $account,
    ): WhatsappAccount {
        $phoneNumberId = config('whatsapp.phone_number_id');
        $accessToken = config('whatsapp.access_token');

        if (!$phoneNumberId || !$accessToken) {
            return $account;
        }

        if ((string) $account->phone_number_id !== (string) $phoneNumberId) {
            return $account;
        }

        $updates = [];

        if ((string) $account->access_token !== (string) $accessToken) {
            $updates['access_token'] = $accessToken;
        }

        $businessAccountId = config('whatsapp.business_account_id');
        if (
            $businessAccountId &&
            (string) $account->business_account_id !==
                (string) $businessAccountId
        ) {
            $updates['business_account_id'] = $businessAccountId;
        }

        $defaultName = config('whatsapp.default_account_name');
        if ($defaultName && $account->name !== $defaultName) {
            $updates['name'] = $defaultName;
        }

        if (!$account->is_default) {
            $updates['is_default'] = true;
        }

        if (!empty($updates)) {
            $account->fill($updates);
            $account->save();
            return $account->fresh() ?? $account;
        }

        return $account;
    }

    protected function resolveFromConfig(): ?WhatsappAccount
    {
        $phoneNumberId = config('whatsapp.phone_number_id');
        $accessToken = config('whatsapp.access_token');

        if (!$phoneNumberId || !$accessToken) {
            return null;
        }

        return WhatsappAccount::updateOrCreate(
            ['phone_number_id' => $phoneNumberId],
            [
                'business_account_id' => config(
                    'whatsapp.business_account_id',
                ),
                'access_token' => $accessToken,
                'name' => config('whatsapp.default_account_name'),
                'is_default' => true,
                'metadata' => ['source' => 'config'],
            ],
        );
    }
}
