<?php

namespace Common\Core;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

abstract class BaseModel extends Model
{
    const MODEL_TYPE = '';

    abstract public static function filterableFields(): array;
    abstract public function toNormalizedArray(): array;
    abstract public function toSearchableArray(): array;

    abstract public static function getModelTypeAttribute(): string;

    public function getMorphClass()
    {
        return static::MODEL_TYPE;
    }

    public function scopeMysqlSearch(Builder $builder, string $query): Builder
    {
        $searchableFields = [];
        $searchableRelations = [];

        foreach ((new static())->toSearchableArray() as $field => $value) {
            if (
                !Arr::first(
                    static::filterableFields(),
                    fn($ff) => Str::is($ff, $field),
                )
            ) {
                $relationField = Str::camel($field);
                if ((new static())->isRelation($relationField)) {
                    $searchableRelations[] = $relationField;
                } else {
                    $searchableFields[] = $field;
                }
            }
        }

        $builder->matches($searchableFields, $query);

        foreach ($searchableRelations as $relation) {
            $builder->orWhereHas(
                $relation,
                fn(Builder $q) => $q->mysqlSearch($query),
            );
        }

        return $builder;
    }

    public function scopeMatches(
        Builder $builder,
        array $columns,
        string $value,
    ): Builder {
        $mode = config('scout.scout_mysql_mode');
        $columns = array_map(fn($col) => $this->qualifyColumn($col), $columns);
        if ($mode === 'fulltext' && strlen($value) >= 3) {
            if (is_null($builder->getQuery()->columns)) {
                $builder->select($this->qualifyColumn('*'));
            }
            $colString = implode(',', $columns);
            $builder->selectRaw(
                "MATCH($colString) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance",
                [$value],
            );
            $builder->whereRaw("MATCH($colString) AGAINST(?)", [$value]);
        } else {
            $builder->where(function (Builder $nestedBuilder) use (
                $columns,
                $mode,
                $value,
            ) {
                foreach ($columns as $column) {
                    $nestedBuilder->orWhere(
                        $column,
                        'like',
                        $mode === 'basic' ? "$value%" : "%$value%",
                    );
                }
            });
        }

        return $builder;
    }

    public function getSearchableValues(): array
    {
        $searchableValues = [];
        foreach ($this->toSearchableArray() as $key => $value) {
            if (
                !!Arr::first(
                    static::filterableFields(),
                    fn($ff) => Str::is($ff, $key),
                )
            ) {
                $searchableValues[] = $value;
            }
        }
        return $searchableValues;
    }

    public static function getSearchableKeys($skipRelations = false): array
    {
        $searchableKeys = [];
        foreach ((new static())->toSearchableArray() as $key => $value) {
            if (
                $key !== '_vectors' &&
                !Arr::first(
                    static::filterableFields(),
                    fn($ff) => Str::is($ff, $key),
                ) &&
                (!$skipRelations ||
                    !(new static())->isRelation(Str::camel($key)))
            ) {
                $searchableKeys[] = $key;
            }
        }

        return $searchableKeys;
    }

    /**
     * Ensure all Eloquent date attributes are serialized as ISO-8601 strings.
     * This makes client-side parsing reliable across timezones and libraries.
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        // Use ISO 8601 (e.g. 2026-02-10T12:34:56+00:00)
        return $date->format(\DateTimeInterface::ATOM);
    }
}
