<?php

namespace Common\Files\S3;

use Aws\S3\S3Client;
use Common\Files\FileEntryPayload;
use Common\Files\Uploads\Uploads;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait InteractsWithS3Api
{
    protected function getDisk(): Filesystem
    {
        return Uploads::disk(request('uploadType'), request('backendId'));
    }

    protected function getClient(): ?S3Client
    {
        return $this->getDisk()->getClient();
    }

    protected function getBucket(): string
    {
        return Uploads::backend(request('backendId'))->bucket();
    }

    protected function buildFileKey(): string
    {
        $payload = new FileEntryPayload(request()->all());

        $fileKey = trim("$payload->diskPrefix/$payload->filename", '/');

        $pathPrefix = Uploads::disk(
            $payload->uploadType,
            $payload->backend,
        )->path('');

        // need full path when using direct uploading with presigned s3 urls
        if ($pathPrefix) {
            $fileKey = "{$pathPrefix}{$fileKey}";
        }

        return $fileKey;
    }
}
