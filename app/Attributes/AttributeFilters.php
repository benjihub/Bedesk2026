<?php

namespace App\Attributes;

use App\Attributes\Models\CustomAttribute;
use Common\Database\Datasource\Datasource;
use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttributeFilters
{
    protected ?Collection $attributes = null;

    public function applyToDatasource(Datasource $datasource)
    {
        // attributes will be stored directly on the indexed document
        // in full text search, so we can just use regular filtering
        if (!$datasource->filtererIsMysql()) {
            return;
        }

        $attributeFilters = $datasource->filters->getAndRemove(
            fn($filter) => Str::startsWith($filter['key'], 'ca_'),
        );

        foreach ($attributeFilters as $filter) {
            $this->applyFilterToBuilder($datasource->builder, $filter);
        }
    }

    public function applyFilterToBuilder(
        Builder $builder,
        array $filter,
        string $boolean = 'and',
    ) {
        $builder->whereExists(function ($query) use ($filter, $builder) {
            $modelType = $builder->getModel()->getMorphClass();
            $table = $builder->getModel()->getTable();
            $attribute = $this->getAttributes($modelType)->firstWhere(
                'key',
                str_replace('ca_', '', $filter['key']),
            );

            $query
                ->from('attributables')
                ->whereColumn('attributables.attributable_id', "$table.id")
                ->where('attributables.attributable_type', $modelType)
                ->where('attributables.attribute_id', $attribute->id);

            $this->applyValueWhere($query, $attribute, $filter);
        }, $boolean);
    }

    protected function applyValueWhere(
        Builder $builder,
        CustomAttribute $attribute,
        array $filter,
    ) {
        if ($attribute->format === 'checkboxGroup') {
            return $builder->where(
                'attributables.value',
                'like',
                "%{$filter['value']}%",
            );
        }

        if ($filter['operator'] === 'between') {
            return $builder->whereBetween(
                DB::raw('CAST(attributables.value AS DATETIME)'),
                [$filter['value']['start'], $filter['value']['end']],
            );
        }

        $isNumber =
            $attribute->format === 'number' || $attribute->format === 'switch';
        if ($isNumber) {
            return $builder->where(
                DB::raw('CAST(attributables.value AS UNSIGNED)'),
                $filter['operator'],
                (int) $filter['value'],
            );
        }

        return $builder->where(
            'attributables.value',
            $filter['operator'],
            $filter['value'],
        );
    }

    protected function getAttributes(string $modelType): Collection
    {
        if ($this->attributes === null) {
            $this->attributes = CustomAttribute::query()
                ->where('type', $modelType)
                ->get();
        }
        return $this->attributes;
    }
}
