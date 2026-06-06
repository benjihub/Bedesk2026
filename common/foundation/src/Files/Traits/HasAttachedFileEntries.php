<?php

namespace Common\Files\Traits;

use Common\Files\FileEntry;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasAttachedFileEntries
{
    public function attachedFileEntriesRelation(
        string $relationType,
    ): MorphToMany {
        return $this->morphToMany(
            FileEntry::class,
            'model',
            'file_entry_models',
            'model_id',
            'file_entry_id',
        )
            ->withPivotValue('relation_type', $relationType)
            ->orderBy('file_entries.created_at', 'desc')
            ->withTimestamps();
    }
}
