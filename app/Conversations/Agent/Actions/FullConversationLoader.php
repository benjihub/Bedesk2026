<?php

namespace App\Conversations\Agent\Actions;

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Models\Conversation;
use App\Core\Modules;
use Illuminate\Support\Facades\Schema;
use Common\Tags\Tag;
use Envato\Models\PurchaseCode;

class FullConversationLoader
{
    public function loadData(Conversation $conversation): array
    {
        $conversation->load(['assignee', 'group']);

        $attributes = $conversation
            ->allCustomAttributesWithValue()
            ->where('materialized', false)
            ->get()
            ->map(
                fn(CustomAttribute $attribute) => $attribute->toCompactArray(
                    'agent',
                ),
            );

        // It's possible (though rare) for a conversation to no longer have an
        // associated user (for example, if the customer record was deleted).
        // In that case we want to return a minimal payload instead of
        // throwing an error and causing a 500 on the agent UI.
        $userModel = $conversation
            ->user()
            ->first();

        if ($userModel) {
            $userModel->load(['bans', 'secondaryEmail', 'tags']);
        }

        if ($userModel && settings('envato.enable')) {
            $envatoPurchaseCodes = $userModel
                ->purchaseCodes()
                ->get()
                ->map(function (PurchaseCode $code) {
                    $code->support_expired =
                        !$code->supported_until ||
                        $code->supported_until->lt(now());
                    return $code;
                });
        }

        $session = $userModel?->latestUserSession;

        $tags = $conversation->tags()->get()->map(
            fn(Tag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
            ],
        );

        $user = $userModel
            ? [
                'id' => $userModel->id,
                'name' => $userModel->name,
                'email' => $userModel->email,
                'country' => $userModel->country,
                'city' => $session?->city,
                'timezone' => $userModel->timezone,
                'tags' => $userModel->tags->pluck('name'),
                'banned_at' => $userModel->banned_at,
                'bans' => $userModel->bans->map(
                    fn($ban) => [
                        'id' => $ban->id,
                        'comment' => $ban->comment,
                        'expired_at' => $ban->expired_at,
                    ],
                ),
            ]
            : null;

        // expose whether AI support handoff is active so UI can adjust behavior
        $conversation->setAttribute('ai_handoff_active', (bool) ($conversation->aiAgentSession?->context['support_handoff_active'] ?? false));

        // build session info; if there is no active session record we fall back
        // to the IP that was captured on the conversation itself (request_ip).
        // pick the best available ip for the frontend; if user session
        // exists but has an empty string we want to fall back to the ip that
        // we captured on the conversation itself.  empty string is falsy in JS
        // so the previous null-check in the react component would hide it.
        $ipFromSession = $session?->ip_address;
        $fallbackIp = $conversation->request_ip;
        $ipToExpose = $ipFromSession ?: $fallbackIp;

        $data = [
            'conversation' => $conversation,
            'user' => $user,
            'session' => $session
                ? [
                    'id' => $session->id,
                    'ip_address' => $ipToExpose,
                    'platform' => $session->platform,
                    'browser' => $session->browser,
                    'device' => $session->device,
                ]
                : ($fallbackIp ? [
                    // at this point we only really care about the address,
                    // other properties can be null/empty to satisfy TS shape
                    'id' => null,
                    'ip_address' => $fallbackIp,
                    'platform' => null,
                    'browser' => null,
                    'device' => null,
                ] : null),
            'attributes' => $attributes,
            'envatoPurchaseCodes' => $envatoPurchaseCodes ?? [],
            'tags' => $tags,
        ];

        if (Modules::aiInstalled() && Schema::hasTable('conversation_summaries')) {
            $data['summary'] = $conversation->summary;
        }

        return $data;
    }
}
