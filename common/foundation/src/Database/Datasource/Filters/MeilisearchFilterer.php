<?php

namespace Common\Database\Datasource\Filters;

use Common\Database\Datasource\Filters\Traits\NormalizesFiltersForFulltextEngines;
use Illuminate\Support\Arr;
use Laravel\Scout\Builder;

class MeilisearchFilterer extends BaseFilterer
{
    use NormalizesFiltersForFulltextEngines;

    public function apply(): Builder
    {
        return $this->query
            ->getModel()
            ->search($this->searchTerm, function (
                $driver,
                ?string $query,
                array $options,
            ) {
                $filters = $this->prepareFiltersForMeilisearch();
                $filters = implode(' AND ', $filters);
                if ($filters) {
                    $options['filter'] = $filters;
                }
                return $driver->search($query, $options);
            });
    }

    private function prepareFiltersForMeilisearch(): array
    {
        $filters = $this->normalizeFilters($this->filters->getAll());
        return array_map(function ($filter) {
            $operator = $this->getOperator($filter);

            $value =
                $operator === 'IN' || $operator === 'NOT IN'
                    ? Arr::wrap($filter['value'])
                    : $filter['value'];

            if (is_array($filter['value'])) {
                // key IN [value1, value2]
                if ($operator === 'IN' || $operator === 'NOT IN') {
                    return $this->createFilterString(
                        $filter['key'],
                        $operator,
                        $value,
                    );
                }

                // key = value1 OR key = value2
                $values = array_map(
                    fn($v) => $this->createFilterString(
                        $filter['key'],
                        $this->getOperator($filter),
                        $v,
                    ),
                    $value,
                );
                return '(' . implode(' OR ', $values) . ')';
            } else {
                return $this->createFilterString(
                    $filter['key'],
                    $operator,
                    $value,
                );
            }
        }, $filters);
    }

    protected function getOperator(array $filter)
    {
        if (isset($filter['originalOperator'])) {
            if ($filter['originalOperator'] === 'has') {
                return 'IN';
            } elseif ($filter['originalOperator'] === 'doesntHave') {
                return 'NOT IN';
            }
        }

        return $filter['operator'];
    }

    protected function createFilterString(
        string $key,
        string $operator,
        $value,
    ): string {
        $preparedValue = is_array($value)
            ? '[' . implode(', ', $value) . ']'
            : $value;
        return "$key $operator $preparedValue";
    }
}
