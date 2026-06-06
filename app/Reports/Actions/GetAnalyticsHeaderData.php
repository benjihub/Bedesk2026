<?php

namespace App\Reports\Actions;

use App\Conversations\Models\Conversation;
use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use App\Models\User;
use Common\Admin\Analytics\Actions\GetAnalyticsHeaderDataAction;
use Common\Database\Metrics\MetricDateRange;
use Common\Database\Metrics\ValueMetric;

class GetAnalyticsHeaderData implements GetAnalyticsHeaderDataAction
{
    public function execute(array $params): array
    {
        $dateRange = new MetricDateRange(
            start: $params['startDate'] ?? null,
            end: $params['endDate'] ?? null,
            timezone: $params['timezone'] ?? null,
        );

        return [
            array_merge(
                [
                    'name' => __('New users'),
                ],
                (new ValueMetric(
                    User::query(),
                    dateRange: $dateRange,
                ))->count(),
            ),
            array_merge(
                [
                    'name' => __('Total tickets'),
                ],
                (new ValueMetric(
                    Conversation::query(),
                    dateRange: $dateRange,
                ))->count(),
            ),
            array_merge(
                [
                    'name' => __('Total articles'),
                ],
                (new ValueMetric(
                    HcArticle::query(),
                    dateRange: $dateRange,
                ))->count(),
            ),
            array_merge(
                [
                    'name' => __('Total categories'),
                ],
                (new ValueMetric(
                    HcCategory::query(),
                    dateRange: $dateRange,
                ))->count(),
            ),
        ];
    }
}
