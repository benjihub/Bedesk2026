<?php

namespace Common\Auth\Traits;

use Common\Files\Uploads\Uploads;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HasAvatarAttribute
{
    public function getImageAttribute(?string $value)
    {
        // absolute link
        if ($value && Str::contains($value, '//')) {
            return $value;
        }

        // relative link
        if ($value) {
            return url($value);
        }

        return $value;
    }
}
