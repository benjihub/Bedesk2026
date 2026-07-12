<?php namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBillingUsageLedger extends Model
{
    protected $table = 'ai_billing_usage_ledger';

    protected $guarded = ['id'];

    protected $casts = [
        'credits' => 'int',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(
            AiBillingAccount::class,
            'billing_account_id',
        );
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(
            AiBillingSubscription::class,
            'subscription_id',
        );
    }

    public function topUp(): BelongsTo
    {
        return $this->belongsTo(AiBillingTopUp::class, 'top_up_id');
    }
}
