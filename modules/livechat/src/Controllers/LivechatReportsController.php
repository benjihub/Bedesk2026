<?php

namespace Livechat\Controllers;

use Common\Core\BaseController;
use Common\Database\Metrics\MetricDateRange;
use Livechat\Actions\BuildCampaignReport;
use Livechat\Models\Campaign;

class LivechatReportsController extends BaseController
{
    public function campaigns()
    {
        $this->authorize('show', 'ReportPolicy');

        $overview = (new BuildCampaignReport())->execute([
            'startDate' => request('startDate'),
            'endDate' => request('endDate'),
            'timezone' => request('timezone'),
            'country' => request('country'),
        ]);

        $campaigns = Campaign::query()
            ->select([
                'id',
                'name',
                'impression_count',
                'interaction_count',
                'created_at',
            ])
            ->limit(15)
            //->whereBetween('created_at', [$dateRange->start, $dateRange->end])
            ->get();

        return $this->success([
            'overview' => $overview,
            'campaigns' => $campaigns,
        ]);
    }
}
