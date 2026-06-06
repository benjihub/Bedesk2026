<?php

namespace Livechat\Widget\Controllers;

use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rules\Unique;
use Livechat\Actions\BuildCampaignReport;
use Livechat\Models\Campaign;
use Livechat\Models\CampaignImpression;
use SplFileInfo;

class WidgetCampaignsController extends BaseController
{
    public function index()
    {
        $pagination = (new Datasource(Campaign::query()))->paginate();

        return $this->success(['pagination' => $pagination]);
    }

    public function logImpression(int $campaignId)
    {
        $customer = auth('chatWidget')->user();

        // data will be sent via beacon API, need get it from raw post data
        $data = json_decode(request()->getContent(), true);
        $isInteraction = $data['isInteraction'] ?? false;
        $sessionId = $data['sessionId'] ?? null;

        if (!$sessionId) {
            return $this->success();
        }

        if ($isInteraction) {
            $lastImpression = CampaignImpression::query()
                ->where('user_id', $customer->id)
                ->where('campaign_id', $campaignId)
                ->where('session_id', $data['sessionId'])
                ->latest()
                ->first();
            if ($lastImpression) {
                if (!$lastImpression->interacted) {
                    $lastImpression->update(['interacted' => true]);
                    Campaign::where('id', $campaignId)->increment(
                        'interaction_count',
                    );
                }
                return $this->success();
            }
        }

        if (
            !CampaignImpression::query()
                ->where('user_id', $customer->id)
                ->where('created_at', '>=', now()->subMinute())
                ->exists()
        ) {
            CampaignImpression::create([
                'user_id' => $customer->id,
                'campaign_id' => $campaignId,
                'interacted' => $isInteraction,
                'session_id' => $data['sessionId'],
                'created_at' => now(),
            ]);
            Campaign::where('id', $campaignId)->increment('impression_count');
        }

        return $this->success();
    }
}
