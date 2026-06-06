<?php

namespace App\Features\Line\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineWebhookEvent extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'headers' => 'array',
        'payload' => 'array',
        'signature_valid' => 'boolean',
        'received_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(LineAccount::class, 'account_id');
    }
}
