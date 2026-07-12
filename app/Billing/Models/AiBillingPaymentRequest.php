<?php namespace App\Billing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBillingPaymentRequest extends Model
{
    protected $table = 'ai_billing_payment_requests';

    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'int',
        'expected_crypto_amount' => 'decimal:8',
        'received_crypto_amount' => 'decimal:8',
        'provider_payload' => 'array',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
        'expired_at' => 'datetime',
        'confirmed_at' => 'datetime',
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

    public function confirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
