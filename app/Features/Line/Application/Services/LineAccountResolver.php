<?php

namespace App\Features\Line\Application\Services;

use App\Features\Line\Models\LineAccount;

class LineAccountResolver
{
    public function resolve(?int $accountId): ?LineAccount
    {
        if ($accountId) {
            return LineAccount::find($accountId);
        }

        $default = LineAccount::where('is_default', true)->first();
        if ($default) {
            return $default;
        }

        return $this->resolveFromConfig();
    }

    public function resolveByChannelId(?string $channelId): ?LineAccount
    {
        if ($channelId) {
            // If we have a channel id from the webhook but no account exists,
            // create a placeholder account so incoming messages can be persisted
            // and processed. This allows webhooks from new LINE channels to be
            // accepted without manual account setup.
            return LineAccount::firstOrCreate(
                ['channel_id' => $channelId],
                [
                    'name' => 'LINE ' . substr($channelId, 0, 8),
                    'channel_token' => null,
                    'is_default' => false,
                    'metadata' => ['source' => 'webhook'],
                ]
            );
        }

        $default = LineAccount::where('is_default', true)->first();
        if ($default) {
            return $default;
        }

        return $this->resolveFromConfig();
    }

    protected function resolveFromConfig(): ?LineAccount
    {
        $channelId = config('line.channel_id');
        $channelToken = config('line.channel_token');

        if (!$channelId || !$channelToken) {
            return null;
        }

        return LineAccount::updateOrCreate(
            ['channel_id' => $channelId],
            [
                'name' => config('line.default_account_name'),
                'channel_token' => $channelToken,
                'is_default' => true,
                'metadata' => ['source' => 'config'],
            ],
        );
    }
}
