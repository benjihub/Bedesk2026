<?php namespace App\Reports\Actions\ConversationsOverviewReport;

use Carbon\Carbon;
use Common\Database\Metrics\MetricDateRange;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class HelpdeskReports
{
    protected array $customPresets = [];

    public function __construct(protected string|null $modelType = null) {}

    public function all(array $params): array
    {
        return $this->build('all', $params);
    }

    public function agents(array $params): array
    {
        return $this->build('agents', $params);
    }

    public function tags(array $params): array
    {
        return $this->build('tags', $params);
    }

    public function build(string $preset, array $params): array
    {
        $report = $this->getReport($preset, $params);

        if (
            isset($params['compareStartDate']) &&
            isset($params['compareEndDate'])
        ) {
            $compareReport = $this->getReport($preset, [
                'startDate' => $params['compareStartDate'],
                'endDate' => $params['compareEndDate'],
                'timezone' => $params['timezone'] ?? null,
            ]);
            foreach ($compareReport as $key => $compareDate) {
                $report[$key]['datasets'][] = $compareDate['datasets'][0];
            }
        }

        return $report;
    }

    public function registerPreset(string $preset, callable $callback): self
    {
        $this->customPresets[$preset] = $callback;
        return $this;
    }

    protected function getReport(string $preset, array $params): array
    {
        $dateRange = new MetricDateRange(
            start: $params['startDate'] ?? null,
            end: $params['endDate'] ?? null,
            timezone: $params['timezone'] ?? null,
        );

        return cache()->remember(
            "{$this->modelType}-{$preset}-{$dateRange->start->timestamp}-{$dateRange->end->timestamp}",
            now()->addMinutes(settings('cache.report_minutes', 60)),
            fn() => $this->generateReport($preset, $dateRange),
        );
    }

    protected function generateReport(
        string $preset,
        MetricDateRange $dateRange,
    ): array {
        // can't use Ticket, Reply or other models, because
        // they are just too slow and use too much memory

        $builders = $this->getBuilders($preset, $dateRange);

        DB::table('conversations')
            ->select([
                'id',
                'user_id',
                'created_at',
                'assignee_id',
                'assigned_to',
                'rating',
                'closed_at',
                'closed_by',
                'status_id',
                'status_category',
                'ai_agent_involved',
            ])
            ->when(
                $this->modelType,
                fn($query) => $query->where('type', $this->modelType),
            )
            ->whereBetween('conversations.created_at', [
                $dateRange->start,
                $dateRange->end,
            ])
            ->chunkById(1000, function ($conversations) use ($builders) {
                $conversations = $this->prepareConversations($conversations);

                foreach ($builders as $builder) {
                    $builder->process($conversations);
                }
            });

        $report = [];
        foreach ($builders as $builder) {
            $report[$builder::NAME] = [
                'granularity' => $dateRange->granularity,
                'datasets' => [$builder->finalize()],
                'generatedAt' => now()->toJSON(),
            ];
        }

        return $report;
    }

    protected function getBuilders(
        string $preset,
        MetricDateRange $dateRange,
    ): array {
        return match ($preset) {
            'all' => [
                new NewConversationsReport($dateRange),
                new FirstReplyTimesReport(
                    $dateRange,
                    granularity: $this->modelType === 'ticket'
                        ? 'hours'
                        : 'minutes',
                ),
                new BusiestTimeOfDayReport($dateRange),
                new ConversationTagsReport($dateRange, limit: 8),
                new TaggedConversationsReport($dateRange),
                new ConversationAgentsReport($dateRange, limit: 10),
            ],
            'agents' => [new ConversationAgentsReport($dateRange, limit: 40)],
            'tags' => [
                new TaggedConversationsReport($dateRange),
                new ConversationTagsReport($dateRange, limit: 40),
            ],
            default => isset($this->customPresets[$preset])
                ? $this->customPresets[$preset]($dateRange)
                : [],
        };
    }

    protected function prepareConversations(
        Collection $conversations,
    ): Collection {
        $conversationIds = $conversations->pluck('id');

        // load tags of all given conversations
        $tags = DB::table('tags')
            ->select(
                'tags.name',
                'tags.id',
                'taggables.taggable_id as conversation_id',
            )
            ->leftJoin('taggables', 'taggables.tag_id', '=', 'tags.id')
            ->whereIn('taggables.taggable_id', $conversationIds)
            ->get();

        $tagsDict = [];
        foreach ($tags as $tag) {
            $tagsDict[$tag->conversation_id][] = $tag;
        }

        // load replies of all given conversations
        $replies = DB::table('conversation_items')
            ->select('id', 'conversation_id', 'user_id', 'created_at')
            ->whereIn('conversation_id', $conversationIds)
            ->orderBy('created_at', 'desc')
            ->limit(1000)
            ->get();

        $repliesDict = [];
        foreach ($replies as $reply) {
            $reply->created_at = Carbon::parse($reply->created_at);
            $repliesDict[$reply->conversation_id][] = $reply;
        }

        foreach ($conversations as $k => $conversation) {
            //initiate carbon instances
            $conversations[$k]->closed_at = $conversations[$k]->closed_at
                ? Carbon::parse($conversation->closed_at)
                : null;
            $conversations[$k]->created_at = Carbon::parse(
                $conversation->created_at,
            );

            //assign tags and replies to conversations they belong to
            $conversations[$k]->replies = collect(
                $repliesDict[$conversation->id] ?? [],
            );
            $conversations[$k]->tags = collect(
                $tagsDict[$conversation->id] ?? [],
            );
        }

        return $conversations;
    }
}
