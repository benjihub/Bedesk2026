<?php

namespace Envato\Purchases;

use App\Models\User;
use Envato\EnvatoApiClient;
use Envato\Models\PurchaseCode;

class UserEnvatoPurchases
{
    public function __construct(protected User $user) {}

    public function sync(): User
    {
        $purchases = (new EnvatoApiClient())->getBuyerPurchases(
            $this->user->id,
        );
        if ($purchases && !$purchases->isEmpty()) {
            $this->user
                ->purchaseCodes()
                ->whereNotIn('code', $purchases->pluck('code'))
                ->delete();
            foreach ($purchases as $purchase) {
                $data = array_merge($purchase, ['updated_at' => now()]);
                $this->addUsingPurchase($data);
            }
            $this->user->load('purchaseCodes');
        }

        return $this->user;
    }

    public function addUsingCode(string $code): PurchaseCode|null
    {
        $envatoPurchase = (new EnvatoApiClient())->getPurchaseByCode($code);

        if ($envatoPurchase) {
            return $this->addUsingPurchase($envatoPurchase);
        }

        return null;
    }

    public function addUsingPurchase(array $data): PurchaseCode|null
    {
        // purchase codes are unique, re-assign it to this user, even
        // if it's already assigned to another user or user_id is null
        $existingPurchase = PurchaseCode::where('code', $data['code'])->first();

        if ($existingPurchase) {
            $existingPurchase->update([...$data, 'user_id' => $this->user->id]);
            return $existingPurchase;
        } else {
            return $this->user->purchaseCodes()->create($data);
        }
    }

    public function get(): array
    {
        return $this->user->purchaseCodes
            ->map(
                fn($purchaseCode) => [
                    'id' => $purchaseCode->id,
                    'code' => $purchaseCode->code,
                    'item_name' => $purchaseCode->item_name,
                    'item_id' => $purchaseCode->item_id,
                    'url' => $purchaseCode->url,
                    'image' => $purchaseCode->image,
                    'supported_until' => $purchaseCode->supported_until,
                    'purchased_at' => $purchaseCode->purchased_at,
                    'support_expired' => $purchaseCode->support_expired,
                    'updated_at' => $purchaseCode->updated_at,
                    'envato_username' => $purchaseCode->envato_username,
                    'domain' => $purchaseCode->domain,
                ],
            )
            ->toArray();
    }
}
