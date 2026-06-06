<?php

namespace App\Reports\Actions\ConversationsOverviewReport;

use Common\Database\Metrics\MetricDateRange;
use Common\Database\Metrics\Traits\GeneratesTrendResults;
use Illuminate\Support\Collection;

class TaggedConversationsReport
{
    use GeneratesTrendResults;

    protected array $report;

    const NAME = 'taggedConversations';

    public function __construct(protected MetricDateRange $dateRange)
    {
        $this->report = [
            'total' => 0,
            'taggedTotal' => 0,
            'label' => __('Tagged conversations'),
            'data' => $this->getAllPossibleDateResults($this->dateRange),
        ];
    }

    public function process(Collection $conversations): void
    {
        $this->report['total'] += $conversations->count();

        $format = $this->dateRange->getGroupingFormat();
        $conversations
            ->groupBy(fn($item) => $item->created_at->format($format))
            ->each(function ($group, $key) {
                $taggedConversationCount = $group
                    ->filter(fn($item) => $item->tags->isNotEmpty())
                    ->count();

                $this->report['taggedTotal'] += $taggedConversationCount;

                if (
                    isset($this->report['data'][$key]) &&
                    $taggedConversationCount
                ) {
                    $this->report['data'][$key][
                        'value'
                    ] += $taggedConversationCount;
                }
            });
    }

    public function finalize(): array
    {
        $this->report['data'] = array_values($this->report['data']);

        return $this->report;
    }
}
