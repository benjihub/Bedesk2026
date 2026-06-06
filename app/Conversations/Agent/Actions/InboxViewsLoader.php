<?php

namespace App\Conversations\Agent\Actions;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationView;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class InboxViewsLoader
{
    public function getAll(): array
    {
        $allViews = ConversationView::query()
            ->where('active', true)
            ->where(function (Builder $query) {
                $query
                    ->where('owner_id', Auth::id())
                    ->orWhere('access', ConversationView::VIEW_ACCESS_ANYONE)
                    ->orWhere(function (Builder $query) {
                        $query->where(
                            'access',
                            ConversationView::VIEW_ACCESS_GROUP,
                        );
                        $query->whereIn(
                            'group_id',
                            Auth::user()->groups->pluck('id')->toArray(),
                        );
                    });
            })
            ->orderBy('order', 'asc')
            ->get()
            ->map(fn(ConversationView $view) => $this->normalizeView($view));
        $userViews = $allViews->filter(fn($view) => $view['key'] !== 'groups');
        $nativeGroupView = $allViews->first(
            fn($view) => $view['key'] === 'groups',
        );

        $views = [
            ...$userViews->toArray(),
            ...$this->getGroupViews($nativeGroupView),
        ];

        $views = $this->loadCounts($views);

        return array_map(
            fn(array $view) => [
                'id' => $view['id'],
                'key' => $view['key'] ?? null,
                'name' => $view['name'],
                'pinned' => $view['pinned'] ?? false,
                'icon' => $view['icon'] ?? null,
                'count' => $view['count'] ?? 0,
                'isGroupView' => $view['isGroupView'] ?? false,
            ],
            $views,
        );
    }

    public function getById(string|int $viewId)
    {
        if (Str::startsWith($viewId, 'group:')) {
            // this will override columns and ordering for static group view config
            $internalGroupView = ConversationView::where(
                'key',
                'groups',
            )->first();
            $internalGroupView = $internalGroupView
                ? $this->normalizeView($internalGroupView)
                : null;

            $groupViews = $this->getGroupViews($internalGroupView);

            $groupView = Arr::first(
                $groupViews,
                fn($view) => $view['id'] === $viewId,
            );

            return $internalGroupView && $groupView
                ? array_merge($internalGroupView, $groupView)
                : null;
        }

        $view = ConversationView::query()
            ->where('key', $viewId)
            ->orWhere('id', $viewId)
            ->first();

        return $view ? $this->normalizeView($view) : null;
    }

    protected function getGroupViews(array|null $nativeGroupView): array
    {
        if (!$nativeGroupView) {
            return [];
        }

        return Auth::user()
            ->groups->map(
                fn($group) => [
                    'id' => "group:$group->id",
                    'key' => "group:$group->id",
                    'name' => $group->name,
                    'isGroupView' => true,
                    'pinned' => $nativeGroupView->pinned ?? false,
                    'conditions' => [
                        [
                            'key' => 'group_id',
                            'operator' => '=',
                            'value' => $group->id,
                        ],
                        ...$nativeGroupView['conditions'],
                    ],
                ],
            )
            ->toArray();
    }

    protected function normalizeView(ConversationView $view): array
    {
        $data = $view->toArray();
        $data['conditions'] = $this->normalizeConditions(
            $data['conditions'] ?? null,
        );
        return $data;
    }

    protected function normalizeConditions(mixed $conditions): array
    {
        while (is_string($conditions)) {
            $decoded = json_decode($conditions, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return [];
            }

            $conditions = $decoded;
        }

        return is_array($conditions) ? $conditions : [];
    }

    protected function loadCounts(array $views)
    {
        $openConversations = Conversation::query()
            ->whereIn('assigned_to', [
                Conversation::ASSIGNED_AGENT,
                Conversation::ASSIGNED_BOT,
            ])
            ->where('mode', Conversation::MODE_NORMAL)
            ->whereNotClosed();

        $this->applyGroupVisibilityFilter($openConversations);

        $openConversations = $openConversations
            ->with([
                'tags' => fn($query) => $query->select([
                    'tags.id',
                    'tags.name',
                ]),
                'user' => fn($query) => $query->select([
                    'id',
                    'name',
                    'email',
                    'country',
                ]),
                'customAttributes' => fn($query) => $query->select([
                    'attributes.id',
                    'key',
                    'format',
                    'value',
                ]),
                'aiAgentSession' => fn($q) => $q->select(['id','conversation_id','context']),
            ])
            ->limit(100)
            ->get();

        foreach ($views as $key => $view) {
            $views[$key]['count'] = 0;
        }

        foreach ($openConversations as $conversation) {
            foreach ($views as &$view) {
                // don't show view counts for "all" and "closed" views at all
                if ($view['key'] === 'all' || $view['key'] === 'closed') {
                    continue;
                }

                if (!isset($view['conditions']) || empty($view['conditions'])) {
                    $view['count']++;
                    continue;
                }

                $allConditions = collect($view['conditions'])->filter(
                    fn($c) => Arr::get($c, 'match_type', 'all') === 'all',
                );
                $allMatch =
                    $allConditions->isEmpty() ||
                    $allConditions->every(
                        fn($c) => $this->conditionMatches($conversation, $c),
                    );
                $anyConditions = collect($view['conditions'])->filter(
                    fn($c) => Arr::get($c, 'match_type', 'all') === 'any',
                );
                $anyMatch =
                    $anyConditions->isEmpty() ||
                    $anyConditions->some(
                        fn($c) => $this->conditionMatches($conversation, $c),
                    );

                if ($allMatch && $anyMatch) {
                    $view['count']++;
                }
            }
        }

        return $views;
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

    protected function conditionMatches(
        Conversation $conversation,
        array $condition,
    ): bool {
        $conversationValue = $this->conversationValue(
            $conversation,
            $condition,
        );
        $conditionValue = $this->conditionValue($condition);
        $operator = $condition['operator'];

        if (Str::endsWith($condition['key'], '_hours')) {
            $hoursAgo = now()->subHours($conditionValue);
            return match ($operator) {
                '>' => $conversationValue->lt($hoursAgo),
                '<' => $conversationValue->gt($hoursAgo),
            };
        }

        return match ($operator) {
            '=' => $conversationValue === $conditionValue,
            '!=' => $conversationValue !== $conditionValue,
            '>' => $conversationValue > $conditionValue,
            '<' => $conversationValue < $conditionValue,
            '<=' => $conversationValue <= $conditionValue,
            '>=' => $conversationValue >= $conditionValue,
            'notNull' => $conversationValue !== null,
            'contains' => Str::contains($conversationValue, $conditionValue),
            'notContains' => !Str::contains(
                $conversationValue,
                $conditionValue,
            ),
            'startsWith' => Str::startsWith(
                $conversationValue,
                $conditionValue,
            ),
            'endsWith' => Str::endsWith($conversationValue, $conditionValue),
            'has' => count(
                array_intersect($conversationValue, Arr::wrap($conditionValue)),
            ) > 0,
            'doesntHave' => count(
                array_intersect($conversationValue, Arr::wrap($conditionValue)),
            ) === 0,
        };
    }

    protected function conditionValue(array $condition)
    {
        if ($condition['key'] === 'tags') {
            return array_map(
                fn($tag) => is_array($tag) ? $tag['id'] : $tag,
                $condition['value'],
            );
        }

        return match ($condition['value']) {
            'currentUser' => Auth::id(),
            'null' => null,
            default => $condition['value'],
        };
    }

    protected function conversationValue(
        Conversation $conversation,
        array $condition,
    ) {
        if (Str::endsWith($condition['key'], '_hours')) {
            $propertyName = str_replace('_hours', '', $condition['key']);
            return $conversation->{$propertyName};
        }

        if (Str::startsWith($condition['key'], 'ca_')) {
            return $conversation->customAttributes
                ->where('key', str_replace('ca_', '', $condition['key']))
                ->first()?->value;
        }

        return match ($condition['key']) {
            'country' => $conversation->user?->country,
            'tags' => $conversation->tags->pluck('id')->toArray(),
            'needs_human_support' => (bool) ($conversation->aiAgentSession?->context['support_handoff_active'] ?? false),
            default => $conversation->{$condition['key']},
        };
    }
}
