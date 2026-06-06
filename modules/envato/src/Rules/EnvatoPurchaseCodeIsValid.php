<?php

namespace Envato\Rules;

use Envato\EnvatoApiClient;
use Illuminate\Contracts\Validation\Rule;

class EnvatoPurchaseCodeIsValid implements Rule
{
    public function passes($attribute, $value): bool
    {
        if (
            !settings('envato.enable') ||
            !settings('envato.require_purchase_code')
        ) {
            return true;
        }

        if ($value) {
            return !is_null((new EnvatoApiClient())->getPurchaseByCode($value));
        }

        return false;
    }

    public function message(): string
    {
        return __('This purchase code is not valid.');
    }
}
