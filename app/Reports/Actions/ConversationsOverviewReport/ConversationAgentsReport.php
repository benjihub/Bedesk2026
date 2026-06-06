<?php

namespace App\Reports\Actions\ConversationsOverviewReport;

use App\Models\User;
use Common\Database\Metrics\MetricDateRange;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class ConversationAgentsReport
{
    protected array $report;

    const NAME = 'agents';

    protected array $agents = [];
    protected array $agentsIds = [];
    protected int $totalConversations = 0;

    public function __construct(
        protected MetricDateRange $dateRange,
        protected int $limit = 10,
    ) {
        $this->report = [
            'label' => __('New conversations'),
            'totalAgentReplies' => 0,
            'avgResponseTime' => 0,
            'satisfaction' => 0,
            'totalRatings' => 0,
            'positiveRatings' => 0,
            'totalConversations' => 0,
            'data' => null,
        ];
    }

    public function process(Collection $conversations): void
    {
        if (!$this->report['data']) {
            $this->report['data'] = [];

            $this->agents = User::whereAgent()
                ->select('id', 'email', 'image', 'name')
                ->limit(50)
                ->get()
                ->toArray();

            $this->agentsIds = array_map(
                fn($agent) => $agent['id'],
                $this->agents,
            );

            $this->totalConversations += $conversations->count();
        }

        $conversations->each(function ($conversation) {
            $this->report['totalConversations']++;

            $assignedTo = $conversation->assignee_id;
            // if conversation is not explicitly assigned to an agent,
            // we'll assume it's assigned to the first agent who replied
            if (!$assignedTo) {
                $assignedTo =
                    $conversation->replies->first(
                        fn($reply) => in_array(
                            $reply->user_id,
                            $this->agentsIds,
                        ),
                    )?->user_id ?? $conversation->closed_by;
            }

            if ($assignedTo && !empty($this->agentsIds)) {
                $this->incrementAgentStats($assignedTo, 'conversationCount');

                if ($conversation->closed_at) {
                    $this->incrementAgentStats(
                        $assignedTo,
                        'resolutionTimeSum',
                        $conversation->created_at->diffInSeconds(
                            $conversation->closed_at,
                        ),
                    );
                }

                if (!is_null($conversation->rating)) {
                    $this->report['totalRatings']++;
                    if ($conversation->rating) {
                        $this->report['positiveRatings']++;
                    }
                }
            }

            $conversation->replies->each(function ($reply, $i) use (
                $conversation,
            ) {
                if (in_array($reply->user_id, $this->agentsIds)) {
                    $this->report['totalAgentReplies']++;
                    $this->incrementAgentStats($reply->user_id, 'replyCount');

                    if ($previous = $conversation->replies[$i + 1] ?? null) {
                        $diffInSeconds = $previous->created_at->diffInSeconds(
                            $reply->created_at,
                        );
                        $this->incrementAgentStats(
                            $reply->user_id,
                            'replyTimeSum',
                            $diffInSeconds,
                        );
                    }
                }
            });

            // count number of conversations each agent closed
            if (in_array($conversation->closed_by, $this->agentsIds)) {
                $this->incrementAgentStats(
                    $conversation->closed_by,
                    'conversationsSolved',
                );
            }
        });
    }

    public function finalize(): array
    {
        if (is_null($this->report['data'])) {
            $this->report['data'] = [];
            return $this->report;
        }

        // add agent emails to their statistics and calculate their average response time
        if (count($this->agents)) {
            foreach ($this->agents as $agent) {
                if (!isset($this->report['data'][$agent['id']])) {
                    continue;
                }

                $percentageOfConversations = $this->report['data'][
                    $agent['id']
                ]['conversationCount']
                    ? round(
                        ($this->report['data'][$agent['id']][
                            'conversationCount'
                        ] /
                            $this->totalConversations) *
                            100,
                        1,
                    )
                    : 0;

                $avgResponseTime =
                    $this->report['data'][$agent['id']]['replyCount'] > 0
                        ? round(
                            $this->report['data'][$agent['id']][
                                'replyTimeSum'
                            ] /
                                $this->report['data'][$agent['id']][
                                    'replyCount'
                                ],
                            1,
                        )
                        : 0;

                $avgResolutionTime = $this->report['data'][$agent['id']][
                    'conversationsSolved'
                ]
                    ? round(
                        $this->report['data'][$agent['id']][
                            'resolutionTimeSum'
                        ] /
                            $this->report['data'][$agent['id']][
                                'conversationsSolved'
                            ],
                        1,
                    )
                    : 0;

                $this->report['data'][$agent['id']][
                    'averageResponseTime'
                ] = $avgResponseTime;
                $this->report['data'][$agent['id']][
                    'averageResolutionTime'
                ] = $avgResolutionTime;
                $this->report['data'][$agent['id']][
                    'percentageOfConversations'
                ] = $percentageOfConversations;
            }

            // sort agents report by number of replies
            usort($this->report['data'], function ($a, $b) {
                return $b['replyCount'] - $a['replyCount'];
            });

            $this->report['avgResponseTime'] = round(
                array_sum(
                    array_map(
                        fn($agent) => $agent['averageResponseTime'],
                        $this->report['data'],
                    ),
                ) / count($this->report['data']),
                1,
            );

            if ($this->report['totalRatings'] === 0) {
                $this->report['satisfaction'] = null;
            } else {
                $this->report['satisfaction'] = $this->report['totalRatings']
                    ? round(
                        ($this->report['positiveRatings'] /
                            $this->report['totalRatings']) *
                            100,
                        1,
                    )
                    : 0;
            }
        }

        if (isset($this->report['data'])) {
            $this->report['data'] = array_values($this->report['data']);
            usort($this->report['data'], function ($a, $b) {
                return $b['conversationCount'] - $a['conversationCount'];
            });
            $this->report['data'] = array_slice(
                $this->report['data'],
                0,
                $this->limit,
            );
        }

        return $this->report;
    }

    protected function incrementAgentStats(
        int $agentId,
        string $statName,
        int $value = 1,
    ): void {
        if (!isset($this->report['data'][$agentId])) {
            $user = Arr::first(
                $this->agents,
                fn($agent) => $agent['id'] === $agentId,
            );
            $this->report['data'][$agentId] = [
                'replyCount' => 0,
                'replyTimeSum' => 0,
                'resolutionTimeSum' => 0,
                'conversationsSolved' => 0,
                'conversationCount' => 0,
                'averageResolutionTime' => 0,
                'id' => $agentId,
                'email' => $user['email'],
                'image' => $user['image'],
                'name' => $user['name'],
            ];
        }

        $this->report['data'][$agentId][$statName] += $value;
    }
}
