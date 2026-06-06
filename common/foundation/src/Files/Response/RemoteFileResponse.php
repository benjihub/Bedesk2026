<?php

namespace Common\Files\Response;

use Carbon\Carbon;
use Common\Files\FileEntry;

class RemoteFileResponse implements FileResponse
{
    public function make(FileEntry $entry, array $options)
    {
        $useTemporaryUrl = config('filesystems.use_presigned_s3_urls');

        if ($options['disposition'] === 'attachment') {
            $fileName = rawurlencode($entry->getNameWithExtension());
            if ($useTemporaryUrl) {
                return $this->getTemporaryUrl($entry, $options, [
                    'ResponseContentType' => 'application/octet-stream',
                    'ResponseContentDisposition' => "attachment;filename={$fileName}",
                ]);
            } else {
                return redirect($entry->url, 302, [
                    'Content-Type' => 'application/octet-stream',
                    'Content-Disposition' => "attachment;filename={$fileName}",
                ]);
            }
        } else {
            if ($useTemporaryUrl) {
                return $this->getTemporaryUrl($entry, $options, [
                    'ResponseContentType' => $entry->mime,
                ]);
            } else {
                return redirect(
                    $entry
                        ->getDisk()
                        ->url($entry->getStoragePath($options['useThumbnail'])),
                );
            }
        }
    }

    private function getTemporaryUrl(
        FileEntry $entry,
        array $entryOptions,
        array $urlOptions,
    ) {
        return redirect(
            $entry
                ->getDisk()
                ->temporaryUrl(
                    $entry->getStoragePath($entryOptions['useThumbnail']),
                    Carbon::now()->addMinutes(30),
                    $urlOptions,
                ),
        );
    }
}
