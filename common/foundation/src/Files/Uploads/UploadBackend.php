<?php

namespace Common\Files\Uploads;

readonly class UploadBackend
{
    public string $id;
    public string $name;
    public string $type;
    public string|null $root;
    public string|null $customDomain;
    public array $config;
    public string $baseDriver;

    public function __construct(array $backend)
    {
        $this->id = $backend['id'];
        $this->name = $backend['name'];
        $this->type = $backend['type'];
        $this->root = $backend['root'] ?? null;
        $this->customDomain = $backend['domain'] ?? null;
        $this->baseDriver = $this->typeToBaseDriver($this->type);
        $this->config = $backend['config'] ?? [];
    }

    public function bucket(): ?string
    {
        return $this->config['bucket'] ?? null;
    }

    public function isS3(): bool
    {
        return $this->baseDriver === 's3';
    }

    public function isLocal(): bool
    {
        return $this->baseDriver === 'local';
    }

    public function flysystemDriver(): string
    {
        if ($this->type === 's3_compatible') {
            return 's3';
        }

        return $this->type;
    }

    public function usesDirectUpload(): bool
    {
        return $this->isS3() && ($this->config['direct_upload'] ?? false);
    }

    protected function typeToBaseDriver(string $type): string
    {
        return match ($type) {
            's3_compatible', 'digitalocean', 'backblaze' => 's3',
            default => $type,
        };
    }
}
