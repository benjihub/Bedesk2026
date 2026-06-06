<?php

namespace Common\Auth\Permissions;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Arr;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'advanced' => 'integer',
    ];

    protected $hidden = ['pivot', 'permissionable_type'];

    protected $appends = ['restrictions'];

    const MODEL_TYPE = 'permission';

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    protected function restrictions(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                // restrictions might be on the model itself is loading via JOIN manually,
                // or on pivot if loading via laravel relationship.
                if (!$value && $this->pivot) {
                    $value = $this->pivot->restrictions;
                }
                $value = $value ?? [];
                return collect(
                    is_string($value) ? json_decode($value, true) : $value,
                )->values();
            },
            set: function ($value) {
                if ($value && is_array($value)) {
                    return json_encode(array_values($value));
                }
                return $value;
            },
        );
    }

    public function getRestrictionValue(string $name): int|bool|null
    {
        $restriction = $this->restrictions->first(function ($restriction) use (
            $name,
        ) {
            return $restriction['name'] === $name;
        });

        return Arr::get($restriction, 'value') ?? null;
    }

    /**
     * Merge restrictions from specified permission into this permission.
     */
    public function mergeRestrictions(?Permission $permission = null): self
    {
        if ($permission) {
            $permission->restrictions->each(function ($restriction) {
                $exists = $this->restrictions->first(function ($r) use (
                    $restriction,
                ) {
                    return $r['name'] === $restriction['name'];
                });
                if (!$exists) {
                    $this->restrictions->push($restriction);
                }
            });
        }
        return $this;
    }
}
