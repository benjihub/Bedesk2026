<?php

namespace App\Team\Models;

use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupPromotion extends BaseModel
{
    public const MODEL_TYPE = 'group_promotion';

    protected $guarded = ['id'];

    protected $casts = [
        'id' => 'integer',
        'group_id' => 'integer',
        'discount' => 'integer',
        'active' => 'boolean',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public static function filterableFields(): array
    {
        return ['id', 'group_id', 'active', 'created_at', 'updated_at'];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'title' => $this->title,
            'description' => $this->description,
            'discount' => $this->discount,
            'code' => $this->code,
            'terms' => $this->terms,
            'how_to_claim' => $this->how_to_claim,
            'active' => $this->active,
            'created_at' => $this->created_at,
        ];
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'title' => $this->title,
            'description' => $this->description,
            'code' => $this->code,
            'active' => $this->active,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
