<?php namespace App\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiBillingPlan extends Model
{
    protected $table = 'ai_billing_plans';

    protected $guarded = ['id'];

    protected $casts = [
        'monthly_price' => 'int',
        'included_credits' => 'int',
        'active' => 'bool',
        'sort_order' => 'int',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(AiBillingSubscription::class, 'plan_id');
    }
}
