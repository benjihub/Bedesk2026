<?php

namespace Envato\Reports;

use Common\Database\Metrics\MetricDateRange;
use Illuminate\Support\Collection;

class EnvatoCountryReport
{
    protected array $report;

    const NAME = 'countries';

    public function __construct(protected MetricDateRange $dateRange)
    {
        $this->report = [
            'label' => __('Earnings'),
            'data' => [],
        ];
    }

    public function process(Collection $data): void
    {
        $data
            ->groupBy('country')
            ->map(
                fn(Collection $values) => [
                    'value' => round($values->sum('amount')),
                    'label' => $values[0]['country'],
                ],
            )
            ->each(function ($datum) {
                if (isset($this->report['data'][$datum['label']])) {
                    $this->report['data'][$datum['label']]['value'] +=
                        $datum['value'];
                } else {
                    $this->report['data'][$datum['label']] = $datum;
                }
            });
    }

    public function finalize(): array
    {
        $this->report['data'] = array_values($this->report['data']);
        $this->report['data'] = array_slice($this->report['data'], 0, 10);
        usort($this->report['data'], fn($a, $b) => $b['value'] <=> $a['value']);

        return $this->report;
    }
}
