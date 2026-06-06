<?php

namespace Common\Files;

use Common\Files\Traits\GetsEntryTypeFromMime;
use Common\Files\Uploads\UploadBackend;
use Common\Files\Uploads\Uploads;
use Common\Files\Uploads\UploadType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use SplFileInfo;
use Symfony\Component\Mime\MimeTypes;

class FileEntryPayload
{
    use GetsEntryTypeFromMime;

    private array $data;
    public string|null $clientName;
    public string $filename;
    public string|null $clientMime;
    public string $clientExtension;
    public string $type;
    public ?string $relativePath;
    public int $size;
    public ?int $parentId;
    public ?int $workspaceId;

    public string|null $diskPrefix;
    public int|null $ownerId;

    public UploadType $uploadType;
    public UploadBackend $backend;

    public function __construct(array $data)
    {
        $this->prepareData($data);
        $this->uploadType = Uploads::type($data['uploadType']);

        $backendId =
            $data['backendId'] ?? Arr::random($this->uploadType->backendIds);
        $this->backend = Uploads::backend($backendId);

        $this->prepareEntryPayload();
    }

    protected function prepareData(array $data): void
    {
        $file = Arr::get($data, 'file');
        $this->data = Arr::except($data, 'file');
        if ($file instanceof UploadedFile) {
            $this->data['clientName'] = $file->getClientOriginalName();
            $this->data['clientMime'] =
                $data['clientMime'] ?? $file->getClientMimeType();
            $this->data['size'] = $file->getSize();
            $this->data[
                'clientExtension'
            ] = $file->getClientOriginalExtension();
        } elseif ($file instanceof SplFileInfo) {
            $this->data['clientName'] = $file->getFilename();
            $this->data['clientMime'] = MimeTypes::getDefault()->guessMimeType(
                $file->getPathname(),
            );
            $this->data['size'] = $file->getSize();
            $this->data['clientExtension'] = $file->getExtension();
        }
    }

    protected function prepareEntryPayload(): void
    {
        $this->clientName = $this->data['clientName'];
        $this->clientMime = $this->data['clientMime'];
        $this->clientExtension = $this->getExtension();
        $this->filename = $this->getFilename();
        $this->workspaceId = Arr::has($this->data, 'workspaceId')
            ? (int) $this->data['workspaceId']
            : null;
        $this->relativePath = $this->getRelativePath();
        $this->diskPrefix = $this->getDiskPrefix();
        $this->parentId = (int) Arr::get($this->data, 'parentId') ?: null;
        $this->ownerId = (int) Arr::get($this->data, 'ownerId') ?: Auth::id();
        $this->size =
            $this->data['file_size'] ??
            ($this->data['size'] ?? $this->data['clientSize']);
        $this->type =
            Arr::get($this->data, 'type') ??
            $this->getTypeFromMime($this->clientMime, $this->clientExtension);
    }

    private function getDiskPrefix()
    {
        if (!$this->uploadType->public) {
            return $this->filename;
        }
    }

    private function getFilename()
    {
        $keepOriginalName = settings('filesystems.keep_original_name');

        if (isset($this->data['filename'])) {
            return $this->data['filename'];
        }

        $uuid = Str::uuid();

        // public files will be stored with extension
        if ($this->uploadType->public) {
            return $keepOriginalName
                ? $this->clientName
                : "{$uuid}.{$this->clientExtension}";
        } else {
            return $uuid;
        }
    }

    private function getRelativePath(): string|null
    {
        // relative path might sometimes be "null" or "false" as string
        $relativePath = Arr::get($this->data, 'relativePath');
        if (!is_string($relativePath) || !Str::contains($relativePath, '/')) {
            $relativePath = null;
        }
        return $relativePath;
    }

    private function getExtension(): string
    {
        if ($extension = Arr::get($this->data, 'clientExtension')) {
            return $extension;
        }

        $pathinfo = pathinfo($this->clientName);

        if (isset($pathinfo['extension'])) {
            return $pathinfo['extension'];
        }

        return explode('/', $this->clientMime)[1];
    }
}
