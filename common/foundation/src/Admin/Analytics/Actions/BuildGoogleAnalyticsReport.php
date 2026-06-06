<?php

namespace Common\Admin\Analytics\Actions;

use Carbon\Carbon;
use Common\Database\Metrics\MetricDateRange;
use Common\Database\Metrics\Traits\GeneratesTrendResults;
use Google\Analytics\Data\V1beta\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\OrderBy;
use Google\Analytics\Data\V1beta\OrderBy\DimensionOrderBy;
use Google\Analytics\Data\V1beta\OrderBy\MetricOrderBy;
use Google\Analytics\Data\V1beta\Row;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class BuildGoogleAnalyticsReport extends BuildAnalyticsReport
{
    use GeneratesTrendResults;

    protected BetaAnalyticsDataClient $client;

    public function __construct(array $params)
    {
        parent::__construct($params);

        $this->client = new BetaAnalyticsDataClient([
            'credentials' => storage_path('laravel-analytics/certificate.json'),
        ]);
    }

    public function execute(): array
    {
        return $this->buildReport();
    }

    protected function buildReport(): array
    {
        $pageViews = $this->buildPageViewsMetric();

        // browsers
        $browsers = [
            'granularity' => $this->dateRange->granularity,
            'datasets' => [
                [
                    'label' => __('Sessions'),
                    'data' => $this->buildTopBrowsersMetric($this->dateRange),
                ],
            ],
        ];
        if ($this->compareDateRange) {
            $browsers['datasets'][] = [
                'label' => __('Sessions'),
                'data' => $this->buildTopBrowsersMetric(
                    $this->compareDateRange,
                ),
            ];
        }

        // locations
        $locations = [
            'granularity' => $this->dateRange->granularity,
            'datasets' => [
                [
                    'label' => __('Sessions'),
                    'data' => $this->buildTopLocationsMetric($this->dateRange),
                ],
            ],
        ];
        if ($this->compareDateRange) {
            $locations['datasets'][] = [
                'label' => __('Sessions'),
                'data' => $this->buildTopLocationsMetric(
                    $this->compareDateRange,
                ),
            ];
        }

        // devices
        $devices = [
            'granularity' => $this->dateRange->granularity,
            'datasets' => [
                [
                    'label' => __('Sessions'),
                    'data' => $this->buildTopDevicesMetric($this->dateRange),
                ],
            ],
        ];
        if ($this->compareDateRange) {
            $devices['datasets'][] = [
                'label' => __('Sessions'),
                'data' => $this->buildTopDevicesMetric($this->compareDateRange),
            ];
        }

        // platforms
        $platforms = [
            'granularity' => $this->dateRange->granularity,
            'datasets' => [
                [
                    'label' => __('Sessions'),
                    'data' => $this->buildTopPlatformsMetric($this->dateRange),
                ],
            ],
        ];
        if ($this->compareDateRange) {
            $platforms['datasets'][] = [
                'label' => __('Sessions'),
                'data' => $this->buildTopPlatformsMetric(
                    $this->compareDateRange,
                ),
            ];
        }

        return [
            'pageViews' => [
                'datasets' => $pageViews,
                'granularity' => $this->dateRange->granularity,
                'total' => $pageViews[0]['data']->sum('value'),
            ],
            'browsers' => $browsers,
            'locations' => $locations,
            'devices' => $devices,
            'platforms' => $platforms,
        ];
    }

    protected function buildTopBrowsersMetric(
        MetricDateRange $dateRange,
        int $maxResults = 10,
    ): Collection {
        $rows = $this->performQuery($dateRange, [
            'dimensions' => ['browser'],
            'metrics' => ['sessions'],
            'sort' => ['direction' => 'desc', 'metric' => 'sessions'],
        ]);

        $topBrowsers = $rows->map(function (Row $row) {
            return [
                'label' => $row->getDimensionValues()[0]->getValue(),
                'value' => $row->getMetricValues()[0]->getValue(),
            ];
        });

        if ($topBrowsers->count() <= $maxResults) {
            return $topBrowsers;
        }

        return $topBrowsers->take($maxResults - 1)->push([
            'label' => __('Others'),
            'value' => $topBrowsers->splice($maxResults - 1)->sum('value'),
        ]);
    }

    private function buildTopLocationsMetric(
        MetricDateRange $dateRange,
    ): Collection {
        $maxResults = 6;
        $rows = $this->performQuery($dateRange, [
            'metrics' => ['sessions'],
            'dimensions' => ['country'],
            'sort' => [
                'direction' => 'desc',
                'metric' => 'sessions',
            ],
        ]);

        $locations = $rows->map(function (Row $row) {
            return [
                'label' => $row->getDimensionValues()[0]->getValue(),
                'value' => $row->getMetricValues()[0]->getValue(),
            ];
        });
        $total = $locations->sum('value');

        $locations = $locations->map(function ($location) use ($total) {
            $location['percentage'] = round(
                (100 * $location['value']) / $total,
                1,
            );
            return $location;
        });

        if ($locations->count() <= $maxResults) {
            return $locations;
        }

        return $locations->take($maxResults - 1)->push([
            'label' => __('Other'),
            'value' => $locations->splice($maxResults - 1)->sum('value'),
        ]);
    }

    protected function buildTopDevicesMetric(
        MetricDateRange $dateRange,
        int $maxResults = 10,
    ): Collection {
        $rows = $this->performQuery($dateRange, [
            'dimensions' => ['deviceCategory'],
            'metrics' => ['sessions'],
            'sort' => ['direction' => 'desc', 'metric' => 'sessions'],
        ]);

        $devices = $rows->map(function (Row $row) {
            return [
                'label' => __(
                    ucfirst($row->getDimensionValues()[0]->getValue()),
                ),
                'value' => $row->getMetricValues()[0]->getValue(),
            ];
        });

        if ($devices->count() <= $maxResults) {
            return $devices;
        }

        return $devices->take($maxResults - 1)->push([
            'label' => __('Others'),
            'value' => $devices->splice($maxResults - 1)->sum('value'),
        ]);
    }

    protected function buildTopPlatformsMetric(
        MetricDateRange $dateRange,
        int $maxResults = 10,
    ): Collection {
        $rows = $this->performQuery($dateRange, [
            'dimensions' => ['operatingSystem'],
            'metrics' => ['sessions'],
            'sort' => ['direction' => 'desc', 'metric' => 'sessions'],
        ]);

        $platforms = $rows->map(
            fn(Row $row) => [
                'label' => $row->getDimensionValues()[0]->getValue(),
                'value' => $row->getMetricValues()[0]->getValue(),
            ],
        );

        if ($platforms->count() <= $maxResults) {
            return $platforms;
        }

        return $platforms->take($maxResults - 1)->push([
            'label' => __('Others'),
            'value' => $platforms->splice($maxResults - 1)->sum('value'),
        ]);
    }

    private function buildPageViewsMetric(): array
    {
        return [
            [
                'label' => __('Current period'),
                'data' => $this->getPageViews($this->dateRange),
            ],
            [
                'label' => __('Previous period'),
                'data' => $this->getPageViews(
                    $this->compareDateRange ??
                        $this->dateRange->getPreviousPeriod(),
                ),
            ],
        ];
    }

    private function getPageViews(MetricDateRange $dateRange): Collection
    {
        $format = $this->dateRange->getGroupingFormat();

        $results = $this->fetchVisitorsAndPageViews($dateRange)
            // Google Analytics will return views at one minute granularity always.
            // Group these by date format based on selected granularity instead.
            // e.g. "day" granularity will equal "YYYY-MM-DD" => ["value" => 1]
            ->groupBy(fn($item) => $item['date']->format($format))
            // reduce each granularity group to a single value
            ->map(function (Collection $dateGroup) {
                return $dateGroup->reduce(
                    function ($result, $item) {
                        $result['value'] += $item['value'];
                        return $result;
                    },
                    [
                        'date' => $dateGroup[0]['date'],
                        'value' => 0,
                    ],
                );
            })
            ->mapWithKeys(
                fn($item) => [
                    $item['date']->format($format) => $this->formatTrendResult(
                        $dateRange->granularity,
                        $item['date'],
                        $item['value'],
                    ),
                ],
            )
            ->sortKeys()
            ->all();

        $mergedResults = array_replace(
            $this->getAllPossibleDateResults($dateRange),
            $results,
        );

        return collect($mergedResults)->values();
    }

    protected function fetchVisitorsAndPageViews(
        MetricDateRange $dateRange,
    ): Collection {
        $rows = $this->performQuery($dateRange, [
            'dimensions' => ['dateHourMinute', 'pageTitle'], // YYYYMMDDHHMM
            'metrics' => ['totalUsers', 'screenPageViews'],
        ]);

        return $rows->map(function (Row $dateRow) {
            return [
                'date' => Carbon::createFromFormat(
                    'YmdHi',
                    $dateRow->getDimensionValues()[0]->getValue(),
                ),
                'pageTitle' => $dateRow->getDimensionValues()[1]->getValue(),
                'visitors' => (int) $dateRow->getMetricValues()[0]->getValue(),
                'value' => (int) $dateRow->getMetricValues()[1]->getValue(),
            ];
        });
    }

    protected function performQuery(
        MetricDateRange $dateRange,
        array $options,
    ): Collection {
        $orderBy = null;
        if (isset($options['sort'])) {
            $sortOptions = [];
            if (Arr::get($options, 'sort.direction') == 'desc') {
                $sortOptions['desc'] = true;
            }

            if ($metricName = Arr::get($options, 'sort.metric')) {
                $sortOptions['metric'] = (new MetricOrderBy())->setMetricName(
                    $metricName,
                );
            }

            if ($dimensionName = Arr::get($options, 'sort.dimensions')) {
                $sortOptions[
                    'dimension'
                ] = (new DimensionOrderBy())->setDimensionName($dimensionName);
            }

            $orderBy = new OrderBy($sortOptions);
        }

        $propertyId = config('services.google.analytics_property_id');
        $response = $this->client->runReport([
            'property' => "properties/$propertyId",
            'dateRanges' => [$this->getGoogleDateRange($dateRange)],
            'dimensions' => array_map(
                fn($name) => new Dimension(['name' => $name]),
                $options['dimensions'],
            ),
            'metrics' => array_map(
                fn($name) => new Metric(['name' => $name]),
                $options['metrics'],
            ),
            'orderBys' => $orderBy ? [$orderBy] : null,
        ]);

        return collect($response->getRows() ?: []);
    }

    protected function getGoogleDateRange(MetricDateRange $range): DateRange
    {
        return (new DateRange())
            ->setStartDate($range->start->toDateString())
            ->setEndDate($range->end->toDateString());
    }
}
