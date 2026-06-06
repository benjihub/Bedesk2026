<?php

namespace Common\Files\Commands;

use Common\Files\Actions\Deletion\PermanentlyDeleteEntries;
use Common\Files\FileEntry;
use Illuminate\Console\Command;

class DeleteUploadArtifacts extends Command
{
    protected $signature = 'uploads:clean';
    protected $description = 'Delete uploaded files that are no longer used.';

    public function handle(): int
    {
        $typesToSkip = collect(config('filesystems.upload_types'))
            ->filter(fn($config) => $config['dont_clean'] ?? false)
            ->keys()
            ->toArray();

        $entryIds = FileEntry::whereNotNull('upload_type')
            ->whereNotNull('backend_id')
            ->whereNotIn('upload_type', $typesToSkip)
            ->where('origin', 'local')
            ->leftJoin('file_entry_models', function ($join) {
                $join
                    ->on(
                        'file_entries.id',
                        '=',
                        'file_entry_models.file_entry_id',
                    )
                    ->where('file_entry_models.relation_type', '!=', 'access');
            })
            ->whereNull('file_entry_models.file_entry_id')
            ->limit(100)
            ->pluck('id');

        (new PermanentlyDeleteEntries())->execute($entryIds);

        return Command::SUCCESS;
    }
}
