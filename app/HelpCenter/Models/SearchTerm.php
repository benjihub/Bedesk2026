<?php

namespace App\HelpCenter\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchTerm extends Model
{
    const UPDATED_AT = null;
    const MODEL_TYPE = 'search_term';

    protected $guarded = ['id'];
    protected $appends = ['model_type'];

    protected $casts = [
        'id' => 'int',
        'resulted_in_ticket' => 'int',
        'count' => 'int',
        'clicked_article' => 'int',
        'ctr' => 'float',
        'last_seen' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(HcCategory::class);
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
