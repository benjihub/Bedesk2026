<?php

namespace Common\Admin\Analytics\Actions;

use Common\Database\Metrics\MetricDateRange;

abstract class BuildAnalyticsReport
{
    protected MetricDateRange $dateRange;
    protected MetricDateRange|null $compareDateRange = null;

    public function __construct(array $params)
    {
        $this->dateRange = new MetricDateRange(
            start: $params['startDate'] ?? null,
            end: $params['endDate'] ?? null,
            timezone: $params['timezone'] ?? null,
        );

        if (
            isset($params['compareStartDate']) &&
            isset($params['compareEndDate'])
        ) {
            $this->compareDateRange = new MetricDateRange(
                start: $params['compareStartDate'],
                end: $params['compareEndDate'],
                timezone: $params['timezone'] ?? null,
            );
        }
    }

    /**
     * Get data for admin area analytics page from active provider.
     * (Demo or Google Analytics currently)
     */
    abstract public function execute(): array;
}
