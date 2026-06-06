<?php

namespace Common\Files\Uploads;

use Common\Files\FileEntry;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class CountUploadingBackendFiles extends Command
{
    protected $signature = 'uploading:count-files';

    const CACHE_KEY = 'uploading-backend-file-counts';

    public function handle(): void
    {
        $backendCount = count(Uploads::getAllBackends());

        Cache::remember(
            self::CACHE_KEY,
            Carbon::now()->addHours(1),
            function () {
                return array_map(
                    fn($backend) => [
                        'backend_id' => $backend->id,
                        'file_count' => FileEntry::where(
                            'backend_id',
                            $backend->id,
                        )->count(),
                        'total_size' => FileEntry::where(
                            'backend_id',
                            $backend->id,
                        )->sum('file_size'),
                    ],
                    Uploads::getAllBackends(),
                );
            },
        );

        $this->info("Cached file counts for {$backendCount} backends");
    }
}
