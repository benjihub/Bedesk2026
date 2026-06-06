<?php

namespace App\Conversations\Agent\Actions;

use App\Attributes\AttributeFilters;
use App\Conversations\Actions\ConversationListBuilder;
use App\Conversations\Models\Conversation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ConversationListLoader
{
    protected AttributeFilters $attributeFilters;

    public function __construct()
    {
        // have a single instance so attributes fetched from db are cached
        $this->attributeFilters = new AttributeFilters();
    }

    public function load(array $params): array
    {
        $builder = Conversation::query()
            ->whereIn('assigned_to', [
                Conversation::ASSIGNED_AGENT,
                Conversation::ASSIGNED_BOT,
            ])
            ->with('customAttributes');

        $this->applyGroupVisibilityFilter($builder);

        $filters = [];

        if (
            isset($params['viewId']) &&
            ($view = (new InboxViewsLoader())->getById($params['viewId']))
        ) {
            if (!empty($view['conditions'])) {
                foreach ($view['conditions'] as $condition) {
                    $filters[] = $condition;
                }
            }
        }

        $this->applyFilters($builder, $filters);

        // query params order > view order > default order
        $orderBy = $params['orderBy'] ?? ($view['order_by'] ?? 'updated_at');
        $orderDir = $params['orderDir'] ?? ($view['order_dir'] ?? 'desc');

        $builder
            ->orderBy($orderBy, $orderDir)
            ->when(
                $orderBy === 'status_category',
                fn($q) => $q->orderBy('updated_at', 'desc'),
            );

        $response = [
            'pagination' => (new ConversationListBuilder())->simplePagination(
                $builder->simplePaginate(),
            ),
        ];

        if (!empty($view['columns'])) {
            $response['columns'] = $view['columns'];
        }

        return $response;
    }

    protected function applyGroupVisibilityFilter(Builder $builder): void
    {
        $user = Auth::user();
        if (!$user || $user->getPermission('admin')) {
            return;
        }

        $groupIds = $user->groups->pluck('id')->toArray();

        $builder->where(function (Builder $query) use ($groupIds) {
            if (empty($groupIds)) {
                $query->whereRaw('1 = 0');
                return;
            }

            $query->whereIn('group_id', $groupIds);
        });
    }

    protected function applyFilters(Builder $builder, array $filters)
    {
        [$allFilters, $anyFilters] = collect($filters)->partition(
            fn($filter) => Arr::get($filter, 'match_type', 'all') === 'all',
        );

        if ($allFilters->isNotEmpty()) {
            foreach ($allFilters as $filter) {
                $this->applyFilter(
                    filter: $filter,
                    builder: $builder,
                    boolean: 'and',
                    parentBuilder: $builder,
                );
            }
        }

        if ($anyFilters->isNotEmpty()) {
            $builder->where(function (Builder $nestedBuilder) use (
                $anyFilters,
                $builder,
            ) {
                foreach ($anyFilters as $filter) {
                    $this->applyFilter(
                        filter: $filter,
                        builder: $nestedBuilder,
                        boolean: 'or',
                        parentBuilder: $builder,
                    );
                }
            });
        }
    }

    protected function applyFilter(
        array $filter,
        Builder $builder,
        string $boolean,
        Builder $parentBuilder,
    ) {
        if ($filter['value'] === 'currentUser') {
            $filter['value'] = Auth::id();
        }
        if ($filter['value'] === 'null') {
            $filter['value'] = null;
        }

        switch ($filter['key']) {
            case 'created_at':
            case 'updated_at':
            case 'closed_at':
                $builder->whereBetween($filter['key'], [
                    $filter['value']['start'],
                    $filter['value']['end'],
                ]);
                break;
            case Str::startsWith($filter['key'], 'ca_'):
                $this->attributeFilters->applyFilterToBuilder(
                    $builder,
                    $filter,
                    $boolean,
                );
                break;
            case Str::endsWith($filter['key'], '_hours'):
                $col = str_replace('_hours', '', $filter['key']);
                $hoursAgo = now()->subHours($filter['value']);
                if ($filter['operator'] === '>') {
                    $builder->where($col, '<', $hoursAgo);
                } else {
                    $builder->where($col, '>', $hoursAgo);
                }
                break;
            case 'subject':
                $value = match ($filter['operator']) {
                    'contains', 'notContains' => "%{$filter['value']}%",
                    'startsWith' => "{$filter['value']}%",
                    'endsWith' => "%{$filter['value']}",
                    default => $filter['value'],
                };
                $operator = match ($filter['operator']) {
                    '=' => '=',
                    '!=' => '!=',
                    'notContains' => 'not like',
                    default => 'like',
                };
                $builder->where('conversations.subject', $operator, $value);
                break;
            case 'tags':
                if (!$this->alreadyJoined($parentBuilder, 'taggables')) {
                    $parentBuilder->join(
                        'taggables',
                        'taggables.taggable_id',
                        'conversations.id',
                    );
                }
                $builder->where(
                    column: function ($q) use ($filter) {
                        $q->where(
                            'taggables.taggable_type',
                            'conversation',
                        )->where('taggables.tag_id', $filter['value']);
                    },
                    boolean: $boolean,
                );
                break;
            case 'country':
                if (!$this->alreadyJoined($parentBuilder, 'users')) {
                    $parentBuilder->join(
                        'users',
                        'users.id',
                        'conversations.user_id',
                    );
                }
                $builder->where(
                    'users.country',
                    $filter['operator'],
                    $filter['value'],
                    $boolean,
                );
                break;
            case 'needs_human_support':
                // filter on AI session context key support_handoff_active
                $value = (bool) $filter['value'];
                if ($value) {
                    if ($boolean === 'and') {
                        $builder->whereHas(
                            'aiAgentSession',
                            fn($q) => $q->where('context->support_handoff_active', true),
                        );
                    } else {
                        $builder->orWhereHas(
                            'aiAgentSession',
                            fn($q) => $q->where('context->support_handoff_active', true),
                        );
                    }
                } else {
                    if ($boolean === 'and') {
                        $builder->whereDoesntHave(
                            'aiAgentSession',
                            fn($q) => $q->where('context->support_handoff_active', true),
                        );
                    } else {
                        $builder->orWhereDoesntHave(
                            'aiAgentSession',
                            fn($q) => $q->where('context->support_handoff_active', true),
                        );
                    }
                }

                break;
            default:
                if (
                    !in_array($filter['key'], Conversation::filterableFields())
                ) {
                    Log::error(
                        'Invalid conversation filter key: ' . $filter['key'],
                    );
                    break;
                }

                $builder->where(
                    $filter['key'],
                    $filter['operator'],
                    $filter['value'],
                    $boolean,
                );
                break;
        }
    }

    protected function alreadyJoined(Builder $builder, string $table): bool
    {
        if ($builder->getQuery()->joins === null) {
            return false;
        }

        foreach ($builder->getQuery()->joins as $join) {
            if ($join->table === $table) {
                return true;
            }
        }

        return false;
    }
}
