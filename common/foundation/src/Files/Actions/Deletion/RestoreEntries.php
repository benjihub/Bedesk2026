<?php

namespace Common\Files\Actions\Deletion;

use Common\Files\Actions\Deletion\SoftDeleteEntries;
use Common\Files\Events\FileEntriesRestored;
use Illuminate\Support\Collection;

class RestoreEntries extends SoftDeleteEntries
{
    public function execute(Collection|array $entryIds): void
    {
        $entries = $this->entry
            ->onlyTrashed()
            ->whereIn('id', $entryIds)
            ->get();

        $this->chunkChildEntries($entries, function ($chunk) {
            $this->entry->whereIn('id', $chunk->pluck('id'))->restore();
            event(new FileEntriesRestored($chunk->pluck('id')->toArray()));
        });
    }
}
