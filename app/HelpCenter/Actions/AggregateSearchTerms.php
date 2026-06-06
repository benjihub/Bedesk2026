<?php

namespace App\HelpCenter\Actions;

use Axisofstevil\StopWords\Filter;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use webd\language\StringDistance;

class AggregateSearchTerms
{
    public function execute(array $searchSession = []): Collection
    {
        $searchSession = collect($searchSession)
            ->map(function ($sessionItem) {
                if (!isset($sessionItem['normalized_term'])) {
                    $sessionItem['normalized_term'] = slugify(
                        (new Filter())->cleanText($sessionItem['term']),
                        ' ',
                    );
                }
                return $sessionItem;
            })
            ->filter(function ($sessionItem) {
                $len = strlen($sessionItem['normalized_term']);
                return $len > 3 && $len <= 100;
            });

        $searchSession->each(function ($sessionItem, $key) use (
            $searchSession,
        ) {
            $sessionWithoutItem = $searchSession->except($key);
            if (!$this->termIsUnique($sessionWithoutItem, $sessionItem)) {
                unset($searchSession[$key]);
            }
        });

        return $searchSession;
    }

    private function termIsUnique(
        Collection $searchSession,
        array $currentItem,
    ): bool {
        foreach ($searchSession as $nextItem) {
            if (
                $currentItem['term'] === $nextItem['term'] ||
                Str::startsWith($currentItem['term'], $nextItem['term']) ||
                $this->termsAreTooSimilar(
                    $currentItem['term'],
                    $nextItem['term'],
                )
            ) {
                return false;
            }
        }

        return true;
    }

    private function termsAreTooSimilar(string $newest, string $oldest): bool
    {
        return StringDistance::JaroWinkler($newest, $oldest) > 0.8;
    }
}
