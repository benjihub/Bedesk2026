<?php namespace App\Billing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AiBillingAccount extends Model
{
    protected $table = 'ai_billing_accounts';

    protected $guarded = ['id'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(
            AiBillingSubscription::class,
            'billing_account_id',
        );
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(
            AiBillingSubscription::class,
            'billing_account_id',
        )
            ->where('status', 'active')
            ->latestOfMany();
    }

    public function paymentRequests(): HasMany
    {
        return $this->hasMany(
            AiBillingPaymentRequest::class,
            'billing_account_id',
        );
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(
            AiBillingNotification::class,
            'billing_account_id',
        );
    }

    public function topUps(): HasMany
    {
        return $this->hasMany(AiBillingTopUp::class, 'billing_account_id');
    }

    public function usageLedger(): HasMany
    {
        return $this->hasMany(AiBillingUsageLedger::class, 'billing_account_id');
    }
}
