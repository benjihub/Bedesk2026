<?php

namespace App\Reports\Actions\ConversationsOverviewReport;

use Common\Database\Metrics\MetricDateRange;
use Illuminate\Support\Collection;

class BusiestTimeOfDayReport
{
    protected array $report;

    const NAME = 'busiestTimeOfDay';

    public function __construct(protected MetricDateRange $dateRange)
    {
        $this->report = [
            'label' => __('New conversations'),
            'max' => 0,
            'data' => array_fill(0, 7, [
                'value' => [
                    '0-2' => 0,
                    '2-4' => 0,
                    '4-6' => 0,
                    '6-8' => 0,
                    '8-10' => 0,
                    '10-12' => 0,
                    '12-14' => 0,
                    '14-16' => 0,
                    '16-18' => 0,
                    '18-20' => 0,
                    '20-22' => 0,
                    '22-24' => 0,
                ],
            ]),
        ];
    }

    public function process(Collection $conversations): void
    {
        foreach ($conversations as $conversation) {
            $intervalKey =
                floor($conversation->created_at->hour / 2) * 2 .
                '-' .
                (floor($conversation->created_at->hour / 2) + 1) * 2;
            $this->report['data'][$conversation->created_at->dayOfWeek]['value'][
                $intervalKey
            ] += 1;
        }
    }

    public function finalize(): array
    {
        // find the highest amount of conversations in any 2-hour period
        $this->report['max'] = max(
            array_map(
                fn($dayStats) => max($dayStats['value']),
                $this->report['data'],
            ),
        );

        return $this->report;
    }
}
