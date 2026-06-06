<?php

namespace App\Features\Line\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineMessage extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'payload' => 'array',
        'provider_timestamp' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(LineAccount::class, 'account_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(LineContact::class, 'contact_id');
    }
}
