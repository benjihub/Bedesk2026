<?php

namespace Common\Files\Actions;

use Common\Files\Uploads\UploadType;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class FileUploadValidator
{
    public function __construct(
        protected array|null $accept = null,
        protected int|null $maxFileSize = null,
        protected int|null $usedSpace = null,
        protected int|null $availableSpace = null,
    ) {}

    public static function validateForUploadType(
        UploadType $uploadType,
        int $fileSize,
        string $extension,
        string $mime,
    ): Collection|null {
        $spaceUsage = $uploadType->supportsMaxSpaceUsage()
            ? (new GetUserSpaceUsage(uploadType: $uploadType->name))->execute()
            : null;
        return (new self(
            accept: $uploadType->acceptedFileTypes(),
            maxFileSize: $uploadType->maxFileSize(),
            usedSpace: $spaceUsage['used'] ?? null,
            availableSpace: $spaceUsage['available'] ?? null,
        ))->validate(fileSize: $fileSize, extension: $extension, mime: $mime);
    }

    public function validate(
        int $fileSize,
        string $extension,
        string $mime,
    ): Collection|null {
        $errors = collect([
            'size' => $this->validateMaximumFileSize($fileSize),
            'spaceUsage' => $this->validateAllowedStorageSpace($fileSize),
            'allowedExtensions' => $this->validateFileType($extension, $mime),
        ])->filter(fn($msg) => !is_null($msg));

        if (!$errors->isEmpty()) {
            return $errors;
        }

        return null;
    }

    protected function validateMaximumFileSize(?int $fileSize = null): ?string
    {
        if (is_null($this->maxFileSize) || is_null($fileSize)) {
            return null;
        }

        if ($fileSize > $this->maxFileSize) {
            return __('The file size may not be greater than :size', [
                'size' => self::formatBytes($this->maxFileSize),
            ]);
        }

        return null;
    }

    protected function validateAllowedStorageSpace(
        ?int $fileSize = null,
    ): string|null {
        if (is_null($fileSize) || is_null($this->availableSpace)) {
            return null;
        }

        $usedSpace = $this->usedSpace ?? 0;
        $enoughSpace = $usedSpace + $fileSize <= $this->availableSpace;

        if (!$enoughSpace) {
            return self::notEnoughSpaceMessage();
        }

        return null;
    }

    protected function validateFileType(
        ?string $extension = null,
        ?string $mime = null,
    ): string|null {
        $acceptExtensions = [];
        $acceptTypes = [];
        $acceptMimes = [];

        if (!$this->accept) {
            return null;
        }

        foreach ($this->accept as $accept) {
            if (str_contains($accept, '/')) {
                $acceptMimes[] = $accept;
            } elseif (in_array($accept, ['image', 'video', 'audio'])) {
                $acceptTypes[] = $accept;
            } else {
                $acceptExtensions[] = $accept;
            }
        }

        $errorMsg = __('Files of this type are not allowed');

        if (
            $extension &&
            !empty($acceptExtensions) &&
            !$this->extensionMatches($extension, $acceptExtensions)
        ) {
            return $errorMsg;
        }

        if (
            $mime &&
            !empty($acceptMimes) &&
            !$this->mimeMatches($mime, $acceptMimes)
        ) {
            return $errorMsg;
        }

        if (
            $mime &&
            !empty($acceptTypes) &&
            !$this->typeMatches($mime, $acceptTypes)
        ) {
            return $errorMsg;
        }

        return null;
    }

    protected function typeMatches(string $mime, array $types): bool
    {
        if (empty($types)) {
            return false;
        }

        return !!Arr::first($types, fn($type) => Str::is("$type/*", $mime));
    }

    protected function mimeMatches(string $mime, array $mimes): bool
    {
        if (empty($mimes)) {
            return false;
        }

        return in_array($mime, $mimes);
    }

    protected function extensionMatches(
        string $extension,
        array $extensions,
    ): bool {
        if (empty($extensions)) {
            return false;
        }

        $extensions = array_map(
            fn($ext) => str_replace('.', '', $ext),
            $extensions,
        );

        return in_array(str_replace('.', '', $extension), $extensions);
    }

    public static function formatBytes(?int $bytes, $unit = 'MB'): string
    {
        if (is_null($bytes)) {
            return '0 bytes';
        }

        if ((!$unit && $bytes >= 1 << 30) || $unit == 'GB') {
            return number_format($bytes / (1 << 30), 1) . 'GB';
        }
        if ((!$unit && $bytes >= 1 << 20) || $unit == 'MB') {
            return number_format($bytes / (1 << 20), 1) . 'MB';
        }
        if ((!$unit && $bytes >= 1 << 10) || $unit == 'KB') {
            return number_format($bytes / (1 << 10), 1) . 'KB';
        }
        return number_format($bytes) . ' bytes';
    }

    public static function notEnoughSpaceMessage(): string
    {
        return __(
            'You have exhausted your allowed space of :space. Delete some files or upgrade your plan.',
            [
                'space' => self::formatBytes(
                    (new GetUserSpaceUsage())->getAvailableSpace(),
                ),
            ],
        );
    }
}
