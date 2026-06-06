<?php

namespace App\Contacts\Actions;

use App\Attributes\Models\CustomAttribute;
use App\Models\User;
use Envato\Purchases\UserEnvatoPurchases;

class LoadCustomerProfile
{
    public function execute(User $user): array
    {
        $user->load(['latestUserSession', 'bans', 'tags', 'details']);

        $session = $user->latestUserSession;

        $lastActiveAt = $session->updated_at ?? $user->created_at;

        $attributes = $user
            ->allCustomAttributesWithValue()
            ->where('materialized', false)
            ->get()
            ->map(fn(CustomAttribute $attribute) => $attribute->toCompactArray('agent'));

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'image' => $user->image,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'banned_at' => $user->banned_at,
            'ban_reason' => $user->bans->first()->comment ?? null,
            'last_active_at' => $lastActiveAt,
            'was_active_recently' => $user->wasActiveRecently(),
            'timezone' => $user->timezone,
            'session' => $session
                ? [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address,
                    'platform' => $session->platform,
                    'browser' => $session->browser,
                    'device' => $session->device,
                ]
                : null,
            'country' => $session->country ?? $user->country,
            'city' => $session->city ?? null,
            'language' => $user->language,
            'tags' => $user->tags->pluck('name')->toArray(),
            'notes' => $user->details->notes ?? null,
            'emails' => $user->secondaryEmails->pluck('address')->toArray(),
            'envato_purchase_codes' => settings('envato.enable')
                ? (new UserEnvatoPurchases($user))->get()
                : null,
            'attributes' => $attributes,
        ];
    }
}
