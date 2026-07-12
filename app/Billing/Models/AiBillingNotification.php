<?php namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBillingNotification extends Model
{
    protected $table = 'ai_billing_notifications';

    protected $guarded = ['id'];

    protected $casts = [
        'data' => 'array',
        'notified_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(
            AiBillingAccount::class,
            'billing_account_id',
        );
    }
}
