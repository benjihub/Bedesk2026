<?php namespace App\Triggers\Conditions;

use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ValuesComparator
{
    public function compare(
        mixed $value1,
        mixed $value2,
        string $operator,
    ): bool {
        $operator = Str::camel($operator);
        $stringHaystack = strtolower((string) $value1);
        $stringNeedle = strtolower((string) $value2);

        if (is_array($value1)) {
            return match ($operator) {
                'notNull' => !is_null($value1),
                'contains' => in_array($value2, $value1),
                'notContains' => !in_array($value2, $value1),
                default => false,
            };
        }

        $matches = match ($operator) {
            'notNull' => !is_null($value1),
            'contains' => Str::contains($stringHaystack, $stringNeedle),
            'notContains' => !Str::contains($stringHaystack, $stringNeedle),
            'startsWith' => Str::startsWith($stringHaystack, $stringNeedle),
            'endsWith' => Str::endsWith($stringHaystack, $stringNeedle),
            'equals', 'is', '=' => $stringHaystack == $stringNeedle,
            'notEquals', 'not', '!=' => $stringHaystack != $stringNeedle,
            'more', '>' => $value1 > $value2,
            'less', '<' => $value1 < $value2,
            '>=', 'gte' => $value1 >= $value2,
            '<=', 'lte' => $value1 <= $value2,
            'matchesRegex' => (bool) preg_match(
                "/$stringNeedle/",
                $stringHaystack,
            ),
            default => false,
        };

        if ($matches) {
            return $matches;
        }

        // is ISO 8601 date
        if (
            preg_match(
                '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/',
                $stringHaystack,
            )
        ) {
            return $this->compareDates($value1, $value2, $operator);
        }

        return false;
    }

    protected function compareDates(
        mixed $value1,
        mixed $value2,
        string $operator,
    ): bool {
        try {
            $date1 = Carbon::parse($value1);
            $date2 = Carbon::parse($value2);
        } catch (\Exception $e) {
            return false;
        }

        return match ($operator) {
            'notNull' => !is_null($value1),
            'equals', 'is', '=' => $date1->eq($date2),
            'notEquals', 'not', '!=' => $date1->ne($date2),
            'more', '>' => $date1->gt($date2),
            'less', '<' => $date1->lt($date2),
            '>=', 'gte' => $date1->gte($date2),
            '<=', 'lte' => $date1->lte($date2),
            default => false,
        };
    }
}
