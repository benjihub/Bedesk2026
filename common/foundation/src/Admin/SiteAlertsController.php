<?php

namespace Common\Admin;

use Common\Core\BaseController;
use Common\Logging\Schedule\ScheduleLogItem;

class SiteAlertsController extends BaseController
{
    public function __construct()
    {
        $this->middleware('isAdmin');
    }

    public function index()
    {
        $alerts = [];

        if (!config('app.demo')) {
            if (!ScheduleLogItem::scheduleRanInLast30Minutes()) {
                $alerts[] = [
                    'id' => 'cronNotSetup',
                    'title' => 'There is an issue with CRON schedule',
                    'severity' => 'error',
                    'description' =>
                        'The CRON schedule has not run in the last 30 minutes. If you did not set it up yet, please check your server CRON configuration or consult the installation documentation.',
                ];
            }

        }

        return $this->success([
            'alerts' => $alerts,
        ]);
    }
}
