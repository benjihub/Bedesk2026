<?php

namespace Envato\Reports;

use App\Conversations\Models\Conversation;
use Carbon\Carbon;
use Common\Database\Metrics\MetricDateRange;
use Common\Database\Metrics\Trend;
use Envato\EnvatoApiClient;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class EnvatoReportBuilder
{
    public function execute(array $params): array
    {
        $report = $this->buildReport($params);
        if (
            isset($params['compareStartDate']) &&
            isset($params['compareEndDate'])
        ) {
            $compareReport = $this->buildReport([
                'startDate' => $params['compareStartDate'],
                'endDate' => $params['compareEndDate'],
                'timezone' => $params['timezone'] ?? null,
                'skipTicketsReport' => true,
            ]);
            foreach ($compareReport as $key => $compareDate) {
                $report[$key]['datasets'][] = $compareDate['datasets'][0];
            }
        }

        return $report;
    }

    protected function buildReport(array $params): array
    {
        $dateRange = new MetricDateRange(
            start: $params['startDate'] ?? null,
            end: $params['endDate'] ?? null,
            timezone: $params['timezone'] ?? null,
        );

        $builders = [
            new EnvatoEarningsReport($dateRange),
            new EnvatoItemsReport($dateRange),
            new EnvatoCountryReport($dateRange),
        ];

        $data = $this->getDataForPage(1, $dateRange);

        if (isset($data['pagination']['pages'])) {
            $pages = $data['pagination']['pages'];
            for ($i = 2; $i <= $pages; $i++) {
                $data = $this->getDataForPage($i, $dateRange);
                foreach ($builders as $builder) {
                    $builder->process($data['results']);
                }
            }
        } else {
            foreach ($builders as $builder) {
                $builder->process($data['results']);
            }
        }

        foreach ($builders as $builder) {
            $report[$builder::NAME] = [
                'granularity' => $dateRange->granularity,
                'datasets' => [$builder->finalize()],
            ];
        }

        if (!isset($params['skipTicketsReport'])) {
            $report['earningsVsTickets'] = [
                'granularity' => $dateRange->granularity,
                'datasets' => [
                    [
                        'label' => __('Earnings'),
                        'data' => $report['earnings']['datasets'][0]['data'],
                    ],
                    [
                        'label' => __('New conversations'),
                        'data' => (new Trend(
                            Conversation::query(),
                            dateRange: $dateRange,
                        ))->count(),
                    ],
                ],
            ];
        }

        return $report;
    }

    protected function getDataForPage(int $page, MetricDateRange $dateRange)
    {
        $client = new EnvatoApiClient();

        $startDate = $dateRange->start->format('Y-m-d');
        $endDate = $dateRange->end->format('Y-m-d');
        $cacheKey = "envato.$startDate.$endDate.$page";

        if (cache()->has($cacheKey)) {
            $cachedResponse = json_decode(cache($cacheKey), true);
            $cachedResponse['results'] = collect(
                $cachedResponse['results'],
            )->map(function ($item) {
                $item['date'] = Carbon::parse($item['date']);
                return $item;
            });
            return $cachedResponse;
        } else {
            $response = $client
                ->call('user/statement', [
                    'from_date' => $startDate,
                    'to_date' => $endDate,
                    'page' => $page,
                ])
                ->json();

            // only store data that is used to reduce cache size
            $response['results'] = $this->formatStatementData(
                $response['results'],
            );
            $response['pagination'] = [
                'pages' => $response['pagination']['pages'],
            ];

            $cacheTime = $dateRange->start->lessThan(now()->startOfMonth())
                ? now()->addHour()
                : now()->addMonth();

            cache()->put($cacheKey, json_encode($response), $cacheTime);
            return $response;
        }
    }

    protected function formatStatementData(array $data): Collection
    {
        // filter out withdrawals
        $data = collect($data)->filter(function ($item) {
            return $item['order_id'];
        });

        [, $sales] = $data->partition(function ($item) {
            return Str::startsWith($item['detail'], ['Refund', 'Reversal of']);
        });

        return $sales
            ->map(function ($item) {
                $nameParts = explode('(', $item['detail']);
                return [
                    'date' => Carbon::parse($item['date']),
                    // multiple items can be purchased in same order, but we need
                    // to group sale/fee records by item and not by order id
                    'sale_id' => $item['order_id'] + $item['item_id'],
                    'item_id' => (int) $item['item_id'],
                    'amount' => (float) abs($item['amount']),
                    'price' => $item['price'],
                    'type' => $item['type'] === 'Sale' ? 'sale' : 'fee',
                    // MTDb - Ultimate Movie&TV Database (6 months included support)
                    'item' => trim($nameParts[0]),
                    'country' =>
                        $item['other_party_country'] ?: __('Unspecified'),
                    'included_support' => Str::contains(
                        $item['detail'],
                        'included support',
                    ),
                ];
            })
            ->groupBy('sale_id')
            ->map(function (Collection $saleGroup) {
                [$fees, $sales] = $saleGroup->partition(
                    fn($item) => $item['type'] === 'fee',
                );

                $totalFee = $fees->sum('amount');
                $totalEarnings = $sales->sum('price');
                $itemSales = $saleGroup->filter(
                    fn($item) => $item['type'] === 'sale' &&
                        $item['included_support'] === false,
                );

                $uniqueItem = $itemSales->first();
                if ($uniqueItem) {
                    $uniqueItem['amount'] = $totalEarnings - $totalFee;
                    $uniqueItem['count'] = $itemSales->count();
                    return $uniqueItem;
                }
                return null;
            })
            ->filter()
            ->values();
    }
}
