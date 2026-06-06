<?php

namespace App\Contacts\Actions;

use App\Attributes\AttributeFilters;
use App\Models\User;
use Carbon\Carbon;
use Common\Database\Datasource\Datasource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class PaginateCustomers
{
    public function __construct(protected array $params) {}

    public function execute()
    {
        $builder = User::query();

        $datasource = new Datasource(
            $builder,
            $this->params,
            filtererName: config('scout.driver'),
            qualifySortColumns: false,
        );

        $this->maybeFilterByType($datasource);

        // don't show agents
        $datasource->filters->add([
            'key' => 'type',
            'operator' => '=',
            'value' => 'user',
        ]);

        if ($datasource->filtererIsMysql()) {
            $this->prefixUserSessionsTableFilters($datasource);
            $this->applyPageVisitsFiltersOnMysql($datasource, $builder);
        }

        (new AttributeFilters())->applyToDatasource($datasource, $builder);

        $datasource->setQueryCallback(function (Builder $query) {
            return $query
                ->withCount(['pageVisits', 'conversations'])
                ->leftJoinSub(
                    function ($query) {
                        $query
                            ->select([
                                'user_id',
                                'id',
                                'updated_at',
                                'city',
                                DB::raw(
                                    'ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn',
                                ),
                            ])
                            ->from('user_sessions');
                    },
                    'user_sessions',
                    function ($join) {
                        $join
                            ->on('users.id', '=', 'user_sessions.user_id')
                            ->where('user_sessions.rn', '=', 1);
                    },
                )
                ->addSelect('user_sessions.updated_at as last_active_at')
                ->addSelect('user_sessions.city');
        });

        return $this->buildResponse($datasource->paginate()->toArray());
    }

    protected function buildResponse(array $pagination)
    {
        $data = $pagination['data'];
        $pagination = [
            ...$pagination,
            'data' => array_map(
                fn(array $user) => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'image' => $user['image'],
                    'email' => $user['email'],
                    'city' => $user['city'] ?? null,
                    'country' => $user['country'],
                    'created_at' => $user['created_at'],
                    'updated_at' => $user['updated_at'],
                    'banned_at' => $user['banned_at'],
                    'last_active_at' => Arr::get($user, 'last_active_at')
                        ? Carbon::parse($user['last_active_at'])->toJSON()
                        : null,
                    'page_visits_count' => $user['page_visits_count'] ?? 0,
                    'conversations_count' => $user['conversations_count'] ?? 0,
                ],
                $data,
            ),
        ];

        return $pagination;
    }

    protected function maybeFilterByType(Datasource $datasource)
    {
        $type = Arr::pull($this->params, 'type');
        if ($type === 'verified') {
            $datasource->filters->add([
                'key' => 'email_verified_at',
                'operator' => '!=',
                'value' => null,
            ]);
        } elseif ($type === 'visitors') {
            $datasource->filters->add([
                'key' => 'email_verified_at',
                'operator' => '=',
                'value' => null,
            ]);
        } elseif ($type === 'active') {
            $datasource->filters->add([
                'key' => 'user_sessions.updated_at',
                'operator' => '>=',
                'value' => now()->subMinutes(10)->toJSON(),
            ]);
        } elseif ($type === 'suspended') {
            $datasource->filters->add([
                'key' => 'banned_at',
                'operator' => '!=',
                'value' => null,
            ]);
        }
    }

    protected function prefixUserSessionsTableFilters(Datasource $datasource)
    {
        $keysToPrefix = [
            'browser',
            'platform',
            'device',
            'country',
            'city',
            'ip_address',
        ];

        $datasource->filters->transform(function (array $filter) use (
            $keysToPrefix,
        ) {
            if (in_array($filter['key'], $keysToPrefix)) {
                $filter['key'] = "user_sessions.{$filter['key']}";
            }
            return $filter;
        });
    }

    /**
     * Only apply these when using mysql, only "having" will work with lazy loaded count
     */
    protected function applyPageVisitsFiltersOnMysql(
        Datasource $datasource,
        Builder $builder,
    ) {
        if ($datasource->filters->getAndRemove('is_returning')) {
            $builder->having('page_visits_count', '>', 1);
        }

        if (
            $visitsCount = $datasource->filters->getAndRemove(
                'page_visits_count',
            )
        ) {
            $builder->having(
                'page_visits_count',
                $visitsCount['operator'],
                $visitsCount['value'],
            );
        }
    }
}
