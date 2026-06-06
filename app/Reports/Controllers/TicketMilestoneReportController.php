<?php

namespace App\Reports\Controllers;

use App\Conversations\Models\TicketEventLog;
use Common\Core\BaseController;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketMilestoneReportController extends BaseController
{
    public function index()
    {
        $this->authorize('show', 'ReportPolicy');

        $query = $this->filteredQuery()->with([
            'actor:id,name,email',
            'conversation:id,subject,type,channel,group_id,user_id',
            'conversation.group:id,name',
            'conversation.user:id,name,email',
        ]);

        $export = request('export') ?? request('format');

        if ($export === 'csv') {
            return $this->csv($query);
        }

        if ($export === 'jsonl' || $export === 'json') {
            return $this->jsonl($query);
        }

        $pagination = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(request('perPage', 25));

        $conversationIds = (clone $this->filteredQuery())
            ->distinct()
            ->pluck('conversation_id')
            ->all();
        $ticketSummaries = $this->ticketSummaries($conversationIds);

        $pagination->getCollection()->transform(function (
            TicketEventLog $event,
        ) use ($ticketSummaries) {
            $summary = $ticketSummaries[$event->conversation_id] ?? null;
            $event->setAttribute(
                'agents_on_ticket',
                $summary['agents'] ?? [],
            );
            $event->setAttribute(
                'idle_before_first_reply_seconds',
                $summary['idle_before_first_reply_seconds'] ?? null,
            );
            return $event;
        });

        return $this->success([
            'pagination' => $pagination,
            'stats' => $this->stats($ticketSummaries, (clone $this->filteredQuery())->count()),
            'tickets' => array_values($ticketSummaries),
        ]);
    }

    protected function filteredQuery(): Builder
    {
        return TicketEventLog::query()
            ->whereHas(
                'conversation',
                fn(Builder $query) => $query->where('type', 'ticket'),
            )
            ->when(
                request('agent_id'),
                fn(Builder $query, int|string $agentId) => $query->where(
                    'actor_id',
                    $agentId,
                ),
            )
            ->when(
                request('event_type'),
                fn(Builder $query, string $eventType) => $query->where(
                    'event_type',
                    $eventType,
                ),
            )
            ->when(
                request('group_id'),
                fn(Builder $query, int|string $groupId) => $query->whereHas(
                    'conversation',
                    fn(Builder $inner) => $inner->where('group_id', $groupId),
                ),
            )
            ->when(
                request('start_date') ?? request('startDate'),
                fn(Builder $query, string $start) => $query->where(
                    'created_at',
                    '>=',
                    $start,
                ),
            )
            ->when(
                request('end_date') ?? request('endDate'),
                fn(Builder $query, string $end) => $query->where(
                    'created_at',
                    '<=',
                    $end,
                ),
            );
    }

    protected function csv(Builder $query): StreamedResponse
    {
        return response()->streamDownload(
            function () use ($query) {
                $conversationIds = (clone $query)
                    ->distinct()
                    ->pluck('conversation_id')
                    ->all();
                $ticketSummaries = $this->ticketSummaries($conversationIds);
                $out = fopen('php://output', 'w');
                fputcsv($out, [
                    'id',
                    'conversation_id',
                    'subject',
                    'event_type',
                    'actor_id',
                    'actor_name',
                    'group_id',
                    'group_name',
                    'channel',
                    'agents_on_ticket',
                    'idle_before_first_reply_seconds',
                    'created_at',
                    'metadata',
                ]);

                $query
                    ->orderBy('created_at')
                    ->orderBy('id')
                    ->chunk(500, function ($events) use ($out, $ticketSummaries) {
                        foreach ($events as $event) {
                            $summary =
                                $ticketSummaries[$event->conversation_id] ??
                                null;
                            fputcsv($out, [
                                $event->id,
                                $event->conversation_id,
                                $event->conversation?->subject,
                                $event->event_type,
                                $event->actor_id,
                                $event->actor?->name,
                                $event->conversation?->group_id,
                                $event->conversation?->group?->name,
                                $event->conversation?->channel,
                                collect($summary['agents'] ?? [])
                                    ->map(
                                        fn($agent) => $agent['name'] ??
                                            $agent['email'] ??
                                            "#{$agent['id']}",
                                    )
                                    ->implode(', '),
                                $summary[
                                    'idle_before_first_reply_seconds'
                                ] ?? null,
                                $event->created_at?->toISOString(),
                                json_encode($event->metadata ?? []),
                            ]);
                        }
                    });

                fclose($out);
            },
            'ticket-milestones.csv',
            ['Content-Type' => 'text/csv'],
        );
    }

    protected function jsonl(Builder $query): StreamedResponse
    {
        return response()->streamDownload(
            function () use ($query) {
                $conversationIds = (clone $query)
                    ->distinct()
                    ->pluck('conversation_id')
                    ->all();
                $ticketSummaries = $this->ticketSummaries($conversationIds);
                $query
                    ->orderBy('created_at')
                    ->orderBy('id')
                    ->chunk(500, function ($events) use ($ticketSummaries) {
                        foreach ($events as $event) {
                            $summary =
                                $ticketSummaries[$event->conversation_id] ??
                                null;
                            echo json_encode([
                                'id' => $event->id,
                                'conversation_id' => $event->conversation_id,
                                'subject' => $event->conversation?->subject,
                                'event_type' => $event->event_type,
                                'actor_id' => $event->actor_id,
                                'actor_name' => $event->actor?->name,
                                'group_id' => $event->conversation?->group_id,
                                'group_name' => $event->conversation?->group
                                    ?->name,
                                'channel' => $event->conversation?->channel,
                                'agents_on_ticket' => $summary['agents'] ?? [],
                                'idle_before_first_reply_seconds' =>
                                    $summary[
                                        'idle_before_first_reply_seconds'
                                    ] ?? null,
                                'created_at' => $event->created_at?->toISOString(),
                                'metadata' => $event->metadata ?? [],
                            ]) . "\n";
                        }
                    });
            },
            'ticket-milestones.jsonl',
            ['Content-Type' => 'application/x-ndjson'],
        );
    }

    protected function ticketSummaries(array $conversationIds): array
    {
        if (empty($conversationIds)) {
            return [];
        }

        return TicketEventLog::query()
            ->with([
                'actor:id,name,email,image',
                'conversation:id,subject,type,channel,group_id,user_id',
                'conversation.group:id,name',
                'conversation.user:id,name,email',
            ])
            ->whereIn('conversation_id', $conversationIds)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->groupBy('conversation_id')
            ->map(
                fn(Collection $events, int $conversationId) => $this->ticketSummary(
                    $conversationId,
                    $events,
                ),
            )
            ->all();
    }

    protected function ticketSummary(int $conversationId, Collection $events): array
    {
        $conversation = $events->first()?->conversation;
        $needHuman = $events->firstWhere(
            'event_type',
            TicketEventLog::EVENT_NEED_HUMAN_SUPPORT,
        );
        $firstReply = $events->first(
            fn(TicketEventLog $event) => $event->event_type ===
                TicketEventLog::EVENT_FIRST_REPLY &&
                (!$needHuman ||
                    Carbon::parse($event->created_at)->greaterThanOrEqualTo(
                        Carbon::parse($needHuman->created_at),
                    )),
        );

        return [
            'conversation_id' => $conversationId,
            'conversation' => $conversation,
            'group' => $conversation?->group,
            'agents' => $this->agentsForTicket($events),
            'idle_before_first_reply_seconds' => $this->diffSeconds(
                $needHuman?->created_at,
                $firstReply?->created_at,
            ),
            'need_human_at' => $needHuman?->created_at,
            'first_reply_at' => $firstReply?->created_at,
            'events' => $events->values(),
        ];
    }

    protected function agentsForTicket(Collection $events): array
    {
        return $events
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
            ->map(
                fn(TicketEventLog $event) => [
                    'id' => $event->actor->id,
                    'name' => $event->actor->name,
                    'email' => $event->actor->email,
                    'image' => $event->actor->image,
                ],
            )
            ->unique('id')
            ->values()
            ->all();
    }

    protected function stats(array $ticketSummaries, int $totalEvents): array
    {
        $idleValues = collect($ticketSummaries)
            ->pluck('idle_before_first_reply_seconds')
            ->filter(fn($seconds) => $seconds !== null)
            ->values();

        return [
            'total_events' => $totalEvents,
            'unique_tickets' => count($ticketSummaries),
            'avg_idle_before_first_reply_seconds' => $idleValues->isEmpty()
                ? null
                : (int) round($idleValues->avg()),
            'slow_responses_count' => $idleValues
                ->filter(fn(int $seconds) => $seconds > 90 * 60)
                ->count(),
        ];
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
