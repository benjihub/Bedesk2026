<?php

namespace App\Attributes\Traits;

use App\Attributes\Models\CustomAttribute;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

trait HasCustomAttributes
{
    public function customAttributes()
    {
        return $this->morphToMany(
            CustomAttribute::class,
            'attributable',
            'attributables',
            'attributable_id',
            'attribute_id',
        )
            ->withPivot('value')
            ->where('active', true);
    }

    public function allCustomAttributesWithValue()
    {
        return CustomAttribute::query()
            ->where('type', $this->getMorphClass())
            ->select(['attributes.*', 'attributables.value as value'])
            ->leftJoin('attributables', function ($join) {
                $join
                    ->on('attributes.id', '=', 'attributables.attribute_id')
                    ->where('attributables.attributable_id', '=', $this->id)
                    ->where(
                        'attributables.attributable_type',
                        '=',
                        $this->getMorphClass(),
                    );
            });
    }

    public function updateCustomAttributes(
        array|Collection $values,
        $checkPermission = true,
    ) {
        $values = collect($values);

        if ($values->isEmpty()) {
            return;
        }

        $attributes = $this->allCustomAttributesWithValue()
            ->get()
            ->filter(function (CustomAttribute $attribute) use (
                $checkPermission,
            ) {
                // make sure user has permission to this attribute
                return Auth::user()?->isAgent() ||
                    !$checkPermission ||
                    $attribute->permission ===
                        CustomAttribute::PERMISSION_USER_CAN_EDIT;
            });

        $materialized = [];
        $external = [];

        foreach ($values as $key => $value) {
            $attribute = $attributes->where('key', $key)->first();
            if (!$attribute) {
                continue;
            }

            $value = CustomAttribute::castValueForStoring(
                $value,
                $attribute->format,
            );

            // if materialized, check for matching column on the main model
            if ($attribute->materialized) {
                if ($this->{$key} !== $value) {
                    $materialized[$key] = $value;
                }
                continue;
            }

            // if external, check for matching value on attributables pivot
            if ($attribute->value !== $value) {
                $external[$attribute->id] = [
                    'value' => $value,
                ];

                // if custom attribute relation is loaded already, update changed attribute
                if ($this->relationLoaded('customAttributes')) {
                    $index = $this->customAttributes->search(
                        fn($a) => $a->id === $attribute->id,
                    );

                    if ($index === false) {
                        $attribute->value = $value;
                        $this->customAttributes->push($attribute);
                    } else {
                        $this->customAttributes[$index]->value = $value;
                    }
                }
            }
        }

        if (!empty($materialized)) {
            $this->update($materialized);
        }

        if (!empty($external)) {
            $this->customAttributes()->syncWithoutDetaching($external);
        }
    }
}
