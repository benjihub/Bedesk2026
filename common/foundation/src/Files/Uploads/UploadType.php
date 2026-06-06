<?php

namespace Common\Files\Uploads;

use Common\Files\FileEntry;
use Illuminate\Support\Arr;

readonly class UploadType
{
    public string $name;
    public array $backendIds;
    public string $visibility;
    public bool $public;
    public bool $supportsFolders;
    public string|null $prefix;
    protected array $config;

    public function __construct(string $name, array $config)
    {
        $this->name = $name;
        $this->backendIds = $config['backends'] ?? [];
        $this->visibility = $config['visibility'] ?? 'private';
        $this->public = $this->visibility === 'public';
        $this->supportsFolders = $config['supports_folders'] ?? false;
        $this->prefix = $config['prefix'] ?? $this->getDefault('prefix');
        $this->config = $config;
    }

    public function url(FileEntry $entry): string
    {
        $backend = Uploads::backend($entry->backend_id);

        if ($this->public && $backend) {
            // laravel's url method adds leading slash. Need to remove
            // it for relative urls to work when installed on subfolder
            return trim(
                Uploads::disk(
                    $this,
                    $backend,
                    prefix: $entry->disk_prefix,
                )->url($entry->file_name),
                '/',
            );
        }

        return "api/v1/file-entries/$entry->file_name";
    }

    public function runHandler(FileEntry $entry, array $data): FileEntry
    {
        if (isset($this->config['handler'])) {
            return app($this->config['handler'])->handle($entry, $data);
        }

        return $entry;
    }

    public function acceptedFileTypes(): array
    {
        return Arr::get($this->config, 'accept') ?:
            $this->getDefault('accept') ?? [];
    }

    public function maxFileSize(): int|null
    {
        return Arr::get($this->config, 'max_file_size') ?:
            $this->getDefault('max_file_size') ?? null;
    }

    public function supportsMaxSpaceUsage(): bool
    {
        return Arr::get($this->config, 'supports_max_space_usage') ?: false;
    }

    public function defaultMaxSpaceUsage(): int|null
    {
        return Arr::get($this->config, 'max_space_usage_setting')
            ? settings()->get($this->config['max_space_usage_setting'])
            : null;
    }

    public function getS3ACL(): string
    {
        return $this->public ? 'public-read' : 'private';
    }

    protected function getDefault(string $key)
    {
        return config("filesystems.upload_types.$this->name.defaults.$key") ??
            null;
    }

    protected function maybePrefixEntryName(FileEntry $entry): string
    {
        return $entry->disk_prefix
            ? $entry->disk_prefix . '/' . $entry->file_name
            : $entry->file_name;
    }
}
