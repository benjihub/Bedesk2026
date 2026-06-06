<?php

namespace App\Attributes\Models;

use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Casts\Attribute;

class CustomAttribute extends BaseModel
{
    public const MODEL_TYPE = 'attribute';

    protected $table = 'attributes';

    // can be viewed by user in customer ticket page
    public const PERMISSION_USER_CAN_VIEW = 'userCanView';
    // will be visible in new ticket form
    public const PERMISSION_USER_CAN_EDIT = 'userCanEdit';
    // will only be editable by agent
    public const PERMISSION_AGENT_CAN_EDIT = 'agentCanEdit';

    protected $guarded = [];

    protected $casts = [
        'required' => 'boolean',
        'config' => 'array',
        'internal' => 'boolean',
        'materialized' => 'boolean',
        'active' => 'boolean',
    ];

    protected $hidden = ['pivot'];

    protected static function booted(): void
    {
        static::addGlobalScope('active', function ($builder) {
            $builder->where('active', true);
        });
    }

    protected function value(): Attribute
    {
        return Attribute::make(
            get: function ($original, $attributes) {
                $original = isset($this->original['pivot_value'])
                    ? $this->original['pivot_value']
                    : $original;
                return match ($attributes['format']) {
                    'number' => (int) $original,
                    'switch', 'rating' => (bool) $original,
                    'checkboxGroup' => json_decode($original, true),
                    default => $original,
                };
            },
        );
    }

    public static function castValueForStoring(
        mixed $value,
        string $format,
    ): mixed {
        return match ($format) {
            'number' => (int) $value,
            'switch', 'rating' => (bool) $value,
            'checkboxGroup' => json_encode($value),
            default => $value,
        };
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at', 'type', 'format', 'active'];
    }

    public function toArray()
    {
        $array = parent::toArray();

        if (
            isset($this->attributes['value']) ||
            isset($this->original['pivot_value'])
        ) {
            $array['value'] = $this->value;
        }

        return $array;
    }

    public function toCompactArray(string $for = 'customer'): array
    {
        $data = [
            'id' => $this->id,
            'key' => $this->key,
            'required' => $this->required,
            'type' => $this->type,
            'config' => $this->config,
            'format' => $this->format,
            'materialized' => $this->materialized,
            'name' =>
                $for === 'customer'
                    ? $this->customer_name ?? $this->name
                    : $this->name,
            'description' =>
                $for === 'customer'
                    ? $this->customer_description
                    : $this->description,
        ];

        if (
            isset($this->attributes['value']) ||
            isset($this->original['pivot_value'])
        ) {
            $data['value'] = $this->value;
        }

        return $data;
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'model_type' => self::MODEL_TYPE,
        ];
    }

    public function toSearchableArray(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'customer_name' => $this->customer_name,
            'customer_description' => $this->customer_description,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
