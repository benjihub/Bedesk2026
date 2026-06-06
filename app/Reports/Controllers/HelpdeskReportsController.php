<?php namespace App\Reports\Controllers;

use App\Reports\Actions\ConversationsOverviewReport\HelpdeskReports;
use App\Reports\Actions\HelpCenterSearchReport;
use App\Reports\Actions\PopularArticlesReport;
use Common\Core\BaseController;
use Common\Database\Metrics\MetricDateRange;

class HelpdeskReportsController extends BaseController
{
    public function articles()
    {
        $this->authorize('show', 'ReportPolicy');

        $pagination = (new PopularArticlesReport())->generate(request()->all());

        return $this->success(['pagination' => $pagination]);
    }

    public function search(string $type = 'popular')
    {
        $this->authorize('show', 'ReportPolicy');

        $dateRange =
            request('startDate') && request('endDate')
                ? new MetricDateRange(
                    start: request('startDate'),
                    end: request('endDate'),
                    timezone: request('timezone'),
                )
                : null;

        $pagination = (new HelpCenterSearchReport($dateRange))->generate(
            $type,
            request()->all(),
        );

        return $this->success(['pagination' => $pagination]);
    }

    public function conversations(string $modelType)
    {
        $this->authorize('show', 'ReportPolicy');

        $data = (new HelpdeskReports($modelType))->all(request()->all());

        return $this->success($data);
    }

    public function agents()
    {
        $this->authorize('show', 'ReportPolicy');

        $data = (new HelpdeskReports())->agents(request()->all());

        return $this->success($data);
    }

    public function tags()
    {
        $this->authorize('show', 'ReportPolicy');

        $data = (new HelpdeskReports())->tags(request()->all());

        return $this->success($data);
    }
}
