<?php

namespace Common\Files\Uploads;

use Common\Files\Uploads\UploadBackend;
use Common\Files\Uploads\UploadType;
use Illuminate\Support\Str;

readonly class UploadDiskLocation
{
    public string $root;
    public string $prefix;
    public string|null $url;

    public function __construct(
        protected UploadType $type,
        protected UploadBackend $backend,
        protected bool $legacyUrlPrefix = false,
    ) {
        $this->build();
    }

    protected function build(): self
    {
        $backendRoot = $this->backend->root ?? '';
        $uploadTypePrefix = $this->type->prefix ?? '';

        if ($this->backend->isLocal()) {
            $backendRoot = $this->getLocalRoot();
        }

        $this->root = $backendRoot;
        $this->prefix = $uploadTypePrefix;
        $this->url = $this->buildUrl();

        return $this;
    }

    protected function buildUrl(): string|null
    {
        if ($this->legacyUrlPrefix || $this->backend->customDomain) {
            return $this->backend->customDomain;
        }

        // if backend has a root specified, add it to local url.
        // laravel's filesystem adapter "url" method will already
        // add upload type prefix so we just need to add backend root
        if (
            $this->backend->isLocal() &&
            $this->backend->root &&
            !$this->isAbsolutePath($this->backend->root)
        ) {
            return 'storage/' . trim($this->backend->root, '/');
        }

        return null;
    }

    protected function getLocalRoot(): string
    {
        $backendRoot = $this->backend->root ?? '';
        if ($this->isAbsolutePath($backendRoot)) {
            return $backendRoot;
        }

        $defaultRoot = $this->type->public
            ? base_path('public/storage')
            : base_path('storage/app/uploads');
        return "$defaultRoot/$backendRoot";
    }

    protected function isAbsolutePath(string $path): bool
    {
        // Handle empty path
        if (empty($path)) {
            return false;
        }

        // Windows absolute paths
        // C:\path, D:\path, etc. (drive letter followed by colon and backslash)
        if (isset(parse_url($path)['scheme'])) {
            return true;
        }

        if ($path[0] === '/' || $path[0] === '\\') {
            return true;
        }

        return false;
    }
}
