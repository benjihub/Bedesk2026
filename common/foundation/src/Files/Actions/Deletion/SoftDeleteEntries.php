<?php

namespace Common\Files\Actions\Deletion;

use Common\Files\Events\FileEntriesDeleted;
use Common\Files\FileEntry;
use Common\Files\Traits\ChunksChildEntries;
use Illuminate\Support\Collection;

class SoftDeleteEntries
{
    use ChunksChildEntries;

    public function execute(Collection|array $entryIds): void
    {
        collect($entryIds)
            ->chunk(400)
            ->each(function ($ids) {
                $entries = FileEntry::query()
                    ->withTrashed()
                    ->whereIn('id', $ids)
                    ->get();
                $this->delete($entries);
            });
    }

    protected function delete(Collection|array $entries): void
    {
        $this->chunkChildEntries($entries, function ($chunk) {
            FileEntry::query()
                ->whereIn('id', $chunk->pluck('id'))
                ->delete();
            event(
                new FileEntriesDeleted($chunk->pluck('id')->toArray(), false),
            );
        });
    }
}
