<?php namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiBillingTopUp extends Model
{
    protected $table = 'ai_billing_top_ups';

    protected $guarded = ['id'];

    protected $casts = [
        'purchased_credits' => 'int',
        'used_credits' => 'int',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(
            AiBillingAccount::class,
            'billing_account_id',
        );
    }

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(
            AiBillingPaymentRequest::class,
            'payment_request_id',
        );
    }

    public function usageLedger(): HasMany
    {
        return $this->hasMany(AiBillingUsageLedger::class, 'top_up_id');
    }
}
