<?php

namespace Envato\Reports;

use Common\Database\Metrics\MetricDateRange;
use Common\Database\Metrics\Traits\GeneratesTrendResults;
use Illuminate\Support\Collection;

class EnvatoEarningsReport
{
    use GeneratesTrendResults;

    const NAME = 'earnings';

    protected array $report;
    protected array $countries;

    public function __construct(protected MetricDateRange $dateRange)
    {
        $this->report = [
            'label' => __('Earnings'),
            'total' => 0,
            'data' => $this->getAllPossibleDateResults($this->dateRange),
        ];
    }

    public function process(Collection $data): void
    {
        $format = $this->dateRange->getGroupingFormat();
        $data
            ->groupBy(fn($item) => $item['date']->format($format))
            ->each(function ($items, $key) {
                if (isset($this->report['data'][$key])) {
                    $this->report['data'][$key]['value'] += $items->sum(
                        'amount',
                    );
                }
            });

        $this->report['total'] += $data->sum('amount');
    }

    public function finalize(): array
    {
        $this->report['data'] = array_values($this->report['data']);
        return $this->report;
    }
}
