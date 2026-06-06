<?php

namespace App\Conversations\Customer\Controllers;

use App\Attributes\Models\CustomAttribute;
use Common\Core\BaseController;
use Envato\Models\EnvatoItem;
use Envato\Models\PurchaseCode;
use Envato\Purchases\UserEnvatoPurchases;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class CustomerNewTicketPageDataController extends BaseController
{
    public function __invoke()
    {
        $isAgent = Auth::user()?->isAgent();

        $config = settings('hc.newTicket.appearance');
        $config['attributeIds'] = array_values($config['attributeIds'] ?? []);
        $attributeIds = $config['attributeIds'];

        $attributes = CustomAttribute::query()
            ->where('type', 'conversation')
            // when loading attributes for customer, only show attributes that customers can edit
            ->when(
                !$isAgent,
                fn($q) => $q->where(
                    'permission',
                    CustomAttribute::PERMISSION_USER_CAN_EDIT,
                ),
            )
            // for appearance editor will need all attributes for live preview
            ->when(
                !request('loadAllAttributes') || !$isAgent,
                fn($q) => $q->whereIn('id', $attributeIds),
            )
            ->get()
            ->map(
                fn(CustomAttribute $attribute) => $attribute->toCompactArray(
                    'customer',
                ),
            );

        $categoryAttribute = $attributes->first(
            fn($attribute) => $attribute['key'] === 'category',
        );

        $response = [
            'attributes' => $attributes->values(),
            'config' => $config,
        ];

        if (
            $categoryAttribute &&
            ($envatoItems = $this->maybeLoadEnvatoItems())
        ) {
            $response['envatoItems'] = $envatoItems;
        }

        $response['customerEmail'] =
            Auth::user()?->email ?? Auth::user()?->secondaryEmail?->address;
        $response['customerHasVerifiedEmail'] = !!Auth::user()
            ?->email_verified_at;

        return $this->success($response);
    }

    protected function maybeLoadEnvatoItems(): Collection|null
    {
        if (
            !settings('envato.enable') ||
            !settings('envato.require_purchase_code') ||
            !Auth::check()
        ) {
            return null;
        }

        // sync user purchases every 10 minutes, in case they have renewed support recently
        $user = Auth::user()->load('purchaseCodes');
        $latestCode = $user->purchaseCodes->first();
        if (
            !$latestCode ||
            $latestCode->updated_at->lt(now()->subMinutes(10))
        ) {
            (new UserEnvatoPurchases($user))->sync();
        }

        // check if user has purchased each item and if their support for it has not expired
        return EnvatoItem::get()->map(function (EnvatoItem $item) use ($user) {
            $code = $user->purchaseCodes->first(
                fn(PurchaseCode $code) => $code->item_id === $item->item_id &&
                    $code->supported_until?->gt(now()),
            );

            return [
                'id' => $item->id,
                'name' => $item->name,
                'image' => $item->image,
                'support_expired' =>
                    // active support checking can be disabled from settings,
                    // mark support as not expired for all items in that case
                    !settings('envato.active_support') || !$code,
            ];
        });
    }
}
