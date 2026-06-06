<?php

namespace App\Reports\Actions\ConversationsOverviewReport;

use App\Conversations\Models\Conversation;
use Common\Database\Metrics\MetricDateRange;
use Common\Database\Metrics\Traits\GeneratesTrendResults;
use Illuminate\Support\Collection;

class NewConversationsReport
{
    use GeneratesTrendResults;

    protected array $report;

    const NAME = 'newConversations';

    public function __construct(protected MetricDateRange $dateRange)
    {
        $this->report = [
            'total' => 0,
            'solvedTotal' => 0,
            'solvedOnFirstReplyCount' => 0,
            'solvedOnFirstReplyPercentage' => 0,
            'label' => __('New conversations'),
            'data' => $this->getAllPossibleDateResults($this->dateRange),
        ];
    }

    public function process(Collection $conversations): void
    {
        $this->report['total'] += $conversations->count();
        $this->incrementSolvedConversationsCount($conversations);
        $this->incrementResolvedOnFirstReplyCount($conversations);

        $format = $this->dateRange->getGroupingFormat();
        $conversations
            ->groupBy(fn($item) => $item->created_at->format($format))
            ->each(function ($conversations, $key) {
                if (isset($this->report['data'][$key])) {
                    $this->report['data'][$key][
                        'value'
                    ] += $conversations->count();
                }
            });
    }

    public function finalize(): array
    {
        $this->report['data'] = array_values($this->report['data']);

        if ($this->report['solvedTotal'] > 0) {
            $this->report['solvedOnFirstReplyPercentage'] =
                round(
                    $this->report['solvedOnFirstReplyCount'] /
                        $this->report['solvedTotal'],
                    1,
                ) / 100;
        }

        return $this->report;
    }

    protected function incrementSolvedConversationsCount(
        Collection $conversations,
    ): void {
        $this->report['solvedTotal'] += $conversations
            ->filter(function ($conversation) {
                return $conversation->status_category <=
                    Conversation::STATUS_CLOSED &&
                    $conversation->closed_at?->between(
                        $this->dateRange->start,
                        $this->dateRange->end,
                    );
            })
            ->count();
    }

    protected function incrementResolvedOnFirstReplyCount(
        Collection $conversations,
    ): void {
        // conversation is considered resolved on first reply if there's
        // only one agent reply and conversation has closed_at timestamp
        $this->report['solvedOnFirstReplyCount'] += $conversations
            ->filter(
                fn($conversation) => $conversation->closed_at !== null &&
                    $conversation->replies
                        ->filter(
                            fn($reply) => $reply->user_id !==
                                $conversation->user_id,
                        )
                        ->count() === 1,
            )
            ->count();
    }
}
