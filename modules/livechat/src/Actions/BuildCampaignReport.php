<?php

namespace Livechat\Actions;

use Common\Core\Values\ValueLists;
use Common\Database\Metrics\MetricDateRange;
use Common\Database\Metrics\Partition;
use Common\Database\Metrics\Trend;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Livechat\Models\CampaignImpression;

class BuildCampaignReport
{
    protected Builder $builder;
    protected array $params = [];
    protected MetricDateRange $dateRange;

    public function execute(array $params): array
    {
        $this->params = $params;

        $this->builder = CampaignImpression::query()
            ->when(
                isset($params['campaign_id']),
                fn($query) => $query->where(
                    'campaign_id',
                    $params['campaign_id'],
                ),
            )
            ->join(
                'user_sessions',
                'user_sessions.user_id',
                '=',
                'campaign_impressions.user_id',
            );

        $this->dateRange = new MetricDateRange(
            start: $this->params['startDate'] ?? null,
            end: $this->params['endDate'] ?? null,
            timezone: $this->params['timezone'] ?? null,
        );

        return [
            'impressions' => $this->getImpressionsMetric(),
            'devices' => $this->getDevicesMetric(),
            'countries' => $this->getCountriesMetric(),
            'cities' => isset($this->params['country'])
                ? $this->getCitiesMetric($this->params['country'])
                : null,
            'browsers' => $this->getBrowsersMetric(),
            'platforms' => $this->getPlatformsMetric(),
        ];
    }

    protected function getImpressionsMetric(): array
    {
        $impressions = (new Trend(
            $this->builder,
            dateRange: $this->dateRange,
        ))->count();

        $interactions = (new Trend(
            $this->builder->where('interacted', true),
            dateRange: $this->dateRange,
        ))->count();

        return [
            'granularity' => $this->dateRange->granularity,
            'total' => array_sum(Arr::pluck($impressions, 'value')),
            'datasets' => [
                [
                    'label' => __('Impressions'),
                    'data' => $impressions,
                ],
                [
                    'label' => __('Interactions'),
                    'data' => $interactions,
                ],
            ],
        ];
    }

    protected function getDevicesMetric(): array
    {
        return $this->getPartitionMetric('device', 5);
    }

    protected function getBrowsersMetric(): array
    {
        return $this->getPartitionMetric('browser', 8);
    }

    protected function getPlatformsMetric(): array
    {
        return $this->getPartitionMetric('platform', 5);
    }

    protected function getCitiesMetric(string $country): array
    {
        return $this->getPartitionMetric(
            'city',
            builder: $this->builder->where('country', $country),
        );
    }

    protected function getCountriesMetric(): array
    {
        $metric = $this->getPartitionMetric('country');

        $countries = app(ValueLists::class)->countries();
        $metric['datasets'][0]['data'] = array_map(function ($location) use (
            $countries,
            $metric,
        ) {
            // only short country code is stored in DB, get and return full country name as well
            $location['code'] = strtolower($location['label']);
            $location['label'] = Arr::first(
                $countries,
                fn($country) => $country['code'] === $location['code'],
            )['name'];
            return $location;
        }, $metric['datasets'][0]['data']);

        return $metric;
    }

    protected function getPartitionMetric(
        string $groupBy,
        int $limit = 10,
        Builder $builder = null,
    ): array {
        return [
            'datasets' => [
                [
                    'label' => __('Impressions'),
                    'data' => (new Partition(
                        $builder ?? $this->builder,
                        groupBy: $groupBy,
                        dateRange: $this->dateRange,
                        limit: $limit,
                    ))->count(),
                ],
            ],
        ];
    }
}
