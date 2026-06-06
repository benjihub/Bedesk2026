<?php

namespace App\Conversations\Actions;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\TicketEventLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class GetTicketMilestones
{
    public function execute(Conversation $conversation): array
    {
        $timeline = $conversation
            ->ticketEventLogs()
            ->with('actor:id,name,email,image')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        return [
            'timeline' => $timeline->map(fn(TicketEventLog $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'actor_type' => $event->actor_type,
                'actor_id' => $event->actor_id,
                'actor' => $event->actor
                    ? [
                        'id' => $event->actor->id,
                        'name' => $event->actor->name,
                        'email' => $event->actor->email,
                        'image' => $event->actor->image,
                    ]
                    : null,
                'metadata' => $event->metadata ?? [],
                'created_at' => $event->created_at,
            ])->values(),
            'metrics' => $this->metrics($timeline),
        ];
    }

    public function metrics(Collection $timeline): array
    {
        $created = $timeline->firstWhere(
            'event_type',
            TicketEventLog::EVENT_CREATED,
        );
        $firstReply = $timeline->firstWhere(
            'event_type',
            TicketEventLog::EVENT_FIRST_REPLY,
        );
        $needHuman = $timeline->firstWhere(
            'event_type',
            TicketEventLog::EVENT_NEED_HUMAN_SUPPORT,
        );
        $closed = $timeline->firstWhere(
            'event_type',
            TicketEventLog::EVENT_CLOSED,
        );

        $agentsInvolved = $timeline
            ->filter(
                fn(TicketEventLog $event) => $event->actor &&
                    ($event->actor_type === 'human' ||
                        in_array(
                            $event->event_type,
                            [
                                TicketEventLog::EVENT_ASSIGNED,
                                TicketEventLog::EVENT_FIRST_REPLY,
                            ],
                            true,
                        )),
            )
            ->pluck('actor')
            ->filter()
            ->unique('id')
            ->values();

        if ($agentsInvolved->isEmpty() && $firstReply?->actor) {
            $agentsInvolved = collect([$firstReply->actor]);
        }

        return [
            'time_to_first_reply_seconds' => $this->diffSeconds(
                $created?->created_at,
                $firstReply?->created_at,
            ),
            'idle_before_first_reply_seconds' => $this->diffSeconds(
                $needHuman?->created_at,
                $firstReply?->created_at,
            ),
            'resolution_time_seconds' => $this->diffSeconds(
                $created?->created_at,
                $closed?->created_at,
            ),
            'agents_involved' => $agentsInvolved
                ->map(fn($agent) => [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'email' => $agent->email,
                    'image' => $agent->image,
                ])
                ->values(),
            'agent_handling_durations' => $this->handlingDurations($timeline),
        ];
    }

    protected function handlingDurations(Collection $timeline): array
    {
        $assignments = $timeline
            ->where('event_type', TicketEventLog::EVENT_ASSIGNED)
            ->values();
        $closed = $timeline->firstWhere(
            'event_type',
            TicketEventLog::EVENT_CLOSED,
        );

        return $assignments
            ->map(function (TicketEventLog $assignment, int $index) use (
                $assignments,
                $closed,
            ) {
                $nextAssignment = $assignments->get($index + 1);
                $end = $nextAssignment?->created_at ?? $closed?->created_at;

                return [
                    'agent_id' => $assignment->actor_id,
                    'agent' => $assignment->actor
                        ? [
                            'id' => $assignment->actor->id,
                            'name' => $assignment->actor->name,
                            'email' => $assignment->actor->email,
                            'image' => $assignment->actor->image,
                        ]
                        : null,
                    'started_at' => $assignment->created_at,
                    'ended_at' => $end,
                    'duration_seconds' => $this->diffSeconds(
                        $assignment->created_at,
                        $end,
                    ),
                ];
            })
            ->values()
            ->all();
    }

    protected function diffSeconds(
        Carbon|string|null $start,
        Carbon|string|null $end,
    ): int|null {
        if (!$start || !$end) {
            return null;
        }

        return max(0, (int) Carbon::parse($start)->diffInSeconds($end));
    }
}
