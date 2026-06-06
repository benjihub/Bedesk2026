<?php

namespace Common\Files\Traits;

use Common\Files\FileEntry;
use Illuminate\Support\Collection;

trait ChunksChildEntries
{
    /**
     * Run callback over specified entries and all their children in chunks.
     */
    protected function chunkChildEntries(
        array|Collection $entries,
        callable $callback,
    ): void {
        $entries = collect($entries);

        // if there are no folders, we can bail early
        $folders = $entries->filter(fn($entry) => $entry->type === 'folder');
        if ($folders->isEmpty()) {
            $entries->chunk(400)->each($callback);
        }

        $builder = FileEntry::select(['id', 'file_name', 'type'])
            ->whereIn('id', $entries->pluck('id'))
            ->withTrashed();

        $folders->each(function (FileEntry $entry) use ($builder) {
            $path = $entry->getRawOriginal('path');
            $builder->orWhere('path', 'LIKE', "$path/%");
        });

        $builder->chunk(400, $callback);
    }
}
