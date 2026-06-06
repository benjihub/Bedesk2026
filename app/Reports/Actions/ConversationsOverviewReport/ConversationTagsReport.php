<?php

namespace App\Reports\Actions\ConversationsOverviewReport;

use Common\Database\Metrics\MetricDateRange;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ConversationTagsReport
{
    protected array $report;

    const NAME = 'tags';

    public function __construct(
        protected MetricDateRange $dateRange,
        protected int $limit = 10,
    ) {
        $this->report = [
            'label' => __('New conversations'),
            'totalConversations' => 0,
            'data' => [],
        ];
    }

    public function process(Collection $conversations): void
    {
        foreach ($conversations as $conversation) {
            $this->report['totalConversations']++;

            foreach ($conversation->tags as $tag) {
                $name = Str::limit($tag->name, 18);
                if (isset($this->report['data'][$name])) {
                    $this->report['data'][$name]['value']++;
                } else {
                    $this->report['data'][$name] = [
                        'id' => $tag->id,
                        'value' => 1,
                        'label' => $name,
                    ];
                }
            }
        }
    }

    public function finalize(): array
    {
        $data = array_values($this->report['data']);
        uasort($data, fn($a, $b) => $b['value'] <=> $a['value']);
        $this->report['data'] = array_slice($data, 0, $this->limit);

        foreach ($this->report['data'] as $key => $datum) {
            $this->report['data'][$key]['percentageOfConversations'] = round(
                ($datum['value'] / $this->report['totalConversations']) * 100,
                1,
            );
        }

        return $this->report;
    }
}
