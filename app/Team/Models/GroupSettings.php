<?php

namespace App\Team\Models;

use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupSettings extends BaseModel
{
    public const MODEL_TYPE = 'group_settings';

    protected $guarded = ['id'];

    protected $casts = [
        'id' => 'integer',
        'group_id' => 'integer',
        'settings' => 'array',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public static function filterableFields(): array
    {
        return ['id', 'group_id', 'created_at', 'updated_at'];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'settings' => $this->settings ?? [],
        ];
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
