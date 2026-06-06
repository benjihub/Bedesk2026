<?php

namespace App\Features\Line\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LineAccount extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'metadata' => 'array',
        'is_default' => 'boolean',
        'channel_token' => 'encrypted',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(LineContact::class, 'account_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LineMessage::class, 'account_id');
    }
}
