<?php

namespace App\Features\Whatsapp\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsappAccount extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'metadata' => 'array',
        'is_default' => 'boolean',
        'access_token' => 'encrypted',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(WhatsappContact::class, 'account_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsappMessage::class, 'account_id');
    }
}
