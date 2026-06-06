<?php

namespace Common\Files\Response;

use Common\Files\FileEntry;
use Common\Files\Response\FileResponse;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StreamedFileResponse implements FileResponse
{
    public function make(FileEntry $entry, array $options)
    {
        $downloadName = str_replace(
            ['%', '/'],
            '',
            $entry->getNameWithExtension(),
        );

        $thumbnail = $options['useThumbnail'];
        $path = $entry->getStoragePath($thumbnail);
        $response = new StreamedResponse();
        $disposition = $response->headers->makeDisposition(
            $options['disposition'],
            $downloadName,
            Str::ascii($downloadName),
        );

        $response->headers->replace([
            'Content-Type' => $entry->mime,
            'Content-Length' => $thumbnail
                ? $entry->getDisk()->size($path)
                : $entry->file_size,
            'Content-Disposition' => $disposition,
            'Cache-Control' => 'private, max-age=31536000, no-transform',
            //'X-Accel-Buffering' => 'no',
        ]);
        $response->setCallback(function () use ($entry, $path) {
            $stream = $entry->getDisk()->readStream($path);
            if (!$stream) {
                abort(404);
            }

            while (!feof($stream)) {
                echo fread($stream, 2048);
            }
            fclose($stream);
        });
        return $response;
    }
}
