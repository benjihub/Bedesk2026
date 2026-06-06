<?php

namespace App\Features\Line\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LineContact extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'profile' => 'array',
        'metadata' => 'array',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(LineAccount::class, 'account_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LineMessage::class, 'contact_id');
    }
}
