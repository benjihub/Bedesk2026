<?php

namespace Common\Admin\Analytics\Actions;

class BuildNullAnalyticsReport extends BuildAnalyticsReport
{
    public function execute(): array
    {
        return [
            'pageViews' => [
                'granularity' => $this->dateRange->granularity,
                'datasets' => [
                    [
                        'label' => __('Current period'),
                        'data' => [],
                    ],
                    [
                        'label' => __('Previous period'),
                        'data' => [],
                    ],
                ],
            ],
            'browsers' => [
                'granularity' => $this->dateRange->granularity,
                'datasets' => [
                    [
                        'label' => __('Sessions'),
                        'data' => [],
                    ],
                ],
            ],
            'locations' => [
                'granularity' => $this->dateRange->granularity,
                'datasets' => [
                    [
                        'label' => __('Sessions'),
                        'data' => [],
                    ],
                ],
            ],
            'devices' => [
                'granularity' => $this->dateRange->granularity,
                'datasets' => [
                    [
                        'label' => __('Sessions'),
                        'data' => [],
                    ],
                ],
            ],
            'platforms' => [
                'granularity' => $this->dateRange->granularity,
                'datasets' => [
                    [
                        'label' => __('Sessions'),
                        'data' => [],
                    ],
                ],
            ],
        ];
    }
}
