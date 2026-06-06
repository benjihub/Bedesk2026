<?php

namespace Envato\Models;

use Illuminate\Database\Eloquent\Model;

class EnvatoItem extends Model
{
    public const MODEL_TYPE = 'envatoItem';

    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'item_id' => 'integer',
    ];

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'image' => $this->image,
        ];
    }
}
