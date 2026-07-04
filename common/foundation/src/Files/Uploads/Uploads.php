<?php

namespace Common\Files\Uploads;

use Common\Files\FileEntry as FilesFileEntry;
use Common\Files\Uploads\UploadDiskLocation;
use Exception;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Uploads
{
    const STRATEGY_SUBFOLDER = 'subfolder';
    const STRATEGY_FLAT = 'flat';
    const FALLBACK_LOCAL_BACKEND_ID = 'local';

    public static function disk(
        string|UploadType $uploadType,
        string|UploadBackend $backend,
        string|null $prefix = null,
    ): Filesystem {
        $uploadType = is_string($uploadType)
            ? self::type($uploadType)
            : $uploadType;
        $backend = is_string($backend) ? self::backend($backend) : $backend;

        throw_if(
            !$backend || !$uploadType,
            new Exception('Could not resolve upload disk'),
        );

        $location = new UploadDiskLocation($uploadType, $backend);

        return Storage::build([
            'driver' => $backend->flysystemDriver(),
            'throw' => true,
            'root' => $location->root,
            'prefix' =>
                $prefix ?? ($location->prefix ? $location->prefix : null),
            'url' => $location->url,
            'backend_id' => $backend->id,
            'visibility' => $uploadType->visibility,
            ...$backend->config,
        ]);
    }

    public static function getAllBackends(
        UploadType|string|null $uploadType = null,
    ): array {
        $backends = settings('uploading.backends') ?? [];

        if (empty($backends)) {
            $backends[] = self::fallbackLocalBackend();
        }

        $allBackends = array_map(
            fn($backend) => new UploadBackend($backend),
            $backends,
        );

        $uploadType = is_string($uploadType)
            ? self::type($uploadType)
            : $uploadType;
        if ($uploadType) {
            return array_filter(
                $allBackends,
                fn($backend) => in_array($backend->id, $uploadType->backendIds),
            );
        }

        return $allBackends;
    }

    public static function backend(string $id): ?UploadBackend
    {
        return Arr::first(
            self::getAllBackends(),
            fn($backend) => $backend->id === $id,
        );
    }

    public static function getAllTypes(): array
    {
        $typeConfig = config('filesystems.upload_types');
        $userTypeConfig = settings('uploading.types') ?? [];
        $types = [];
        $defaultBackendId = self::getDefaultBackendId();

        foreach ($typeConfig as $name => $config) {
            $config = [
                ...$config,
                ...$userTypeConfig[$name] ?? [],
            ];

            if (empty($config['backends'])) {
                $config['backends'] = [$defaultBackendId];
            }

            $types[] = new UploadType($name, [
                ...$config,
            ]);
        }

        return $types;
    }

    public static function type(string $name): ?UploadType
    {
        return Arr::first(
            self::getAllTypes(),
            fn($type) => $type->name === $name,
        );
    }

    public static function buildLegacyDisk(FilesFileEntry $entry)
    {
        $oldDriver = $entry->public
            ? config('filesystems.public_disk_driver')
            : config('filesystems.uploads_disk_driver');
        $backends = Uploads::getAllBackends();
        $backend = Arr::first(
            $backends,
            fn(UploadBackend $backend) => Str::startsWith(
                $oldDriver,
                $backend->type,
            ),
            $backends[0],
        );

        $root = null;
        if ($oldDriver === 'local') {
            $root = $entry->public
                ? public_path('storage')
                : storage_path('app/uploads');
        }

        // $prefix = $entry->public ? $entry->disk_prefix : '';
        // if ($oldDriver !== 'local') {
        //     $prefix = ($entry->public ? 'storage' : 'uploads') . '/' . $prefix;
        // }
        // $prefix = trim($prefix, '/');
        $prefix = null;

        return Storage::build([
            'driver' => $backend->flysystemDriver(),
            'throw' => true,
            'root' => $root,
            'url' => $backend->customDomain,
            'prefix' => $prefix ? $prefix : null,
            ...$backend->config,
        ]);
    }

    protected static function getDefaultBackendId(): string
    {
        $backends = settings('uploading.backends') ?? [];
        $backend = Arr::first($backends);

        return $backend['id'] ?? self::FALLBACK_LOCAL_BACKEND_ID;
    }

    protected static function fallbackLocalBackend(): array
    {
        return [
            'id' => self::FALLBACK_LOCAL_BACKEND_ID,
            'name' => 'Local',
            'type' => 'local',
        ];
    }
}
