<?php namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiBillingSubscription extends Model
{
    protected $table = 'ai_billing_subscriptions';

    protected $guarded = ['id'];

    protected $casts = [
        'cycle_start' => 'date',
        'cycle_end' => 'date',
        'renewal_date' => 'date',
        'activated_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(
            AiBillingAccount::class,
            'billing_account_id',
        );
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(AiBillingPlan::class, 'plan_id');
    }

    public function usageLedger(): HasMany
    {
        return $this->hasMany(AiBillingUsageLedger::class, 'subscription_id');
    }
}
