<?php

namespace Livechat\Models;

use Illuminate\Database\Eloquent\Model;
use Livechat\Models\IdeHelperCampaignImpression;

/**
 * @mixin IdeHelperCampaignImpression
 */
class CampaignImpression extends Model
{
    protected $guarded = ['id'];

    public $timestamps = false;

    protected $casts = [
        'interacted' => 'bool',
        'created_at' => 'datetime',
        'user_id' => 'int',
        'campaign_id' => 'int',
    ];
}
