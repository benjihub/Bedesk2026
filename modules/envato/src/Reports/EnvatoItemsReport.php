<?php

namespace Envato\Reports;

use Common\Database\Metrics\MetricDateRange;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class EnvatoItemsReport
{
    protected array $report;

    const NAME = 'items';

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
            ->groupBy('item_id')
            ->map(
                fn(Collection $values) => [
                    'value' => round($values->sum('amount')),
                    'label' => $this->formatLabel($values[0]['item']),
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
        usort($this->report['data'], function ($a, $b) {
            return $b['value'] <=> $a['value'];
        });

        return $this->report;
    }

    protected function formatLabel(string $itemName) {
        $itemName = explode('-', $itemName)[0];
        return Str::limit(trim($itemName), 18);
    }
}
