<?php

namespace Common\Files\Response;

use Common\Files\FileEntry;
use Common\Files\Response\FileResponse;

class XAccelRedirectFileResponse implements FileResponse
{
    public function make(FileEntry $entry, array $options)
    {
        $disposition = $options['disposition'];
        header('X-Media-Root: ' . $entry->getDisk()->path(''));
        header(
            "X-Accel-Redirect: {$entry->getStoragePath(
                $options['useThumbnail'],
            )}",
        );
        header("Content-Type: {$entry->mime}");
        header(
            "Content-Disposition: $disposition; filename=\"" .
                $entry->getNameWithExtension() .
                '"',
        );
        exit();
    }
}
