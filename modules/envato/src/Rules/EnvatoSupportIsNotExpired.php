<?php

namespace Envato\Rules;

use App\Attributes\Models\CustomAttribute;
use Carbon\Carbon;
use Closure;
use Envato\Models\EnvatoItem;
use Envato\Models\PurchaseCode;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

class EnvatoSupportIsNotExpired implements ValidationRule
{
    public function validate(
        string $attribute,
        mixed $value,
        Closure $fail,
    ): void {
        if (!settings('envato.active_support') || Auth::user()->isAgent()) {
            return;
        }

        $category = CustomAttribute::where('key', 'category')->first();
        $option = Arr::first(
            $category?->config['options'] ?? [],
            fn($o) => $o['value'] === $value,
        );
        if (!$option) {
            return;
        }

        $nativeEnvatoItemIds = EnvatoItem::query()->pluck('item_id', 'id');

        $hasValidPurchaseCode = collect($option['envatoItems'])->some(
            fn($envatoItemId) => Auth::user()->purchaseCodes->first(
                fn(PurchaseCode $code) => $code->item_id ==
                    $nativeEnvatoItemIds[$envatoItemId] &&
                    !$this->supportExpired($code),
            ),
        );

        if (!$hasValidPurchaseCode) {
            $fail(
                'Your support period for this item has expired. Please renew support on envato to create new tickets.',
            );
        }
    }

    protected function supportExpired(PurchaseCode $code): bool
    {
        if (!$code->supported_until) {
            return false;
        }
        $supportedUntil = is_string($code->supported_until)
            ? Carbon::parse($code->supported_until)
            : $code->supported_until;
        return $supportedUntil->lessThan(Carbon::now());
    }
}
