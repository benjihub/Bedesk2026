<?php

namespace Common\Auth\Traits;

use Illuminate\Database\Eloquent\Casts\Attribute;

trait HasDisplayNameAttribute
{
    protected function name(): Attribute
    {
        return Attribute::make(
            get: function (string|null $value, array $attributes) {
                if (isset($attributes['username']) && $attributes['username']) {
                    return $attributes['username'];
                } elseif ($value) {
                    return $value;
                } elseif ($this->email) {
                    return explode('@', $this->email)[0];
                }
            },
        );
    }
}
