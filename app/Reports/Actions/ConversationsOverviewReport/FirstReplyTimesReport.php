<?php

namespace App\Reports\Actions\ConversationsOverviewReport;

use Common\Database\Metrics\MetricDateRange;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class FirstReplyTimesReport
{
    protected array $report;

    const NAME = 'firstReplyTimes';

    public function __construct(
        protected MetricDateRange $dateRange,
        protected string $granularity,
    ) {
        $labels =
            $this->granularity === 'minutes'
                ? ['0-1', '1-5', '5-15', '15-60', '>60']
                : ['0-1', '1-8', '8-24', '>24'];

        $this->report = [
            'average' => 0,
            'count' => 0,
            'sum' => 0,
            'label' => __('% of all replies'),
            'granularity' => $this->granularity,
            // value is percentage, count is number if occurrences for that hour
            'data' => Arr::mapWithKeys(
                $labels,
                fn($label) => [
                    $label => [
                        'label' => $label,
                        'value' => 0,
                        'count' => 0,
                    ],
                ],
            ),
        ];
    }

    public function process(Collection $conversations): void
    {
        $firstReplyTimes = $conversations
            ->map(function ($conversation) {
                $creatorId = $conversation->user_id;

                // latest replies will be first in array
                $firstAgentReply = $conversation->replies->last(
                    fn($reply) => $reply->user_id != $creatorId,
                );

                if (!$firstAgentReply) {
                    return null;
                }

                return $conversation->created_at->diffInSeconds(
                    $firstAgentReply->created_at,
                );
            })
            ->filter();

        // we'll calculate average time after all conversations are processed, for now just increment count and sum
        $this->report['count'] += $firstReplyTimes->count();
        $this->report['sum'] += $firstReplyTimes->sum();

        if ($this->granularity === 'minutes') {
            $this->incrementByMinute($firstReplyTimes);
        } else {
            $this->incrementByHour($firstReplyTimes);
        }
    }

    protected function incrementByMinute(Collection $replyItems): void
    {
        foreach ($replyItems as $timeInSeconds) {
            $timeInMinutes = $timeInSeconds / 60;
            if ($timeInMinutes <= 1) {
                $this->report['data']['0-1']['count']++;
            }

            if ($timeInMinutes <= 5) {
                $this->report['data']['1-5']['count']++;
            }

            if ($timeInMinutes <= 15) {
                $this->report['data']['5-15']['count']++;
            }

            if ($timeInMinutes <= 60 && $timeInMinutes > 15) {
                $this->report['data']['15-60']['count']++;
            }

            if ($timeInMinutes > 60) {
                $this->report['data']['>60']['count']++;
            }
        }
    }

    protected function incrementByHour(Collection $replyItems): void
    {
        foreach ($replyItems as $timeInSeconds) {
            $timeInHours = $timeInSeconds / 3600;
            if ($timeInHours <= 1) {
                $this->report['data']['0-1']['count']++;
            }

            if ($timeInHours <= 8) {
                $this->report['data']['1-8']['count']++;
            }

            if ($timeInHours <= 24 && $timeInHours > 8) {
                $this->report['data']['8-24']['count']++;
            }

            if ($timeInHours > 24) {
                $this->report['data']['>24']['count']++;
            }
        }
    }

    public function finalize(): array
    {
        //calculate average first response time
        if ($this->report['count']) {
            $this->report['average'] = round(
                $this->report['sum'] / $this->report['count'],
                1,
            );
        }

        //calculate first response time percentages for specific hours
        $total = array_reduce($this->report['data'], function ($carry, $item) {
            return $carry + $item['count'];
        });

        foreach ($this->report['data'] as $key => $stats) {
            if ($total) {
                $percentage = round(($stats['count'] / $total) * 100, 1);
            } else {
                $percentage = 0;
            }

            $this->report['data'][$key]['value'] = $percentage;
        }

        $this->report['data'] = array_values($this->report['data']);
        return $this->report;
    }
}
