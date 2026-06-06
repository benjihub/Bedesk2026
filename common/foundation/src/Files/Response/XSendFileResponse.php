<?php

namespace Common\Files\Response;

use Common\Files\FileEntry;
use Common\Files\Response\FileResponse;

class XSendFileResponse implements FileResponse
{
    public function make(FileEntry $entry, array $options)
    {
        $path =
            $entry->getDisk()->path('') .
            '/' .
            $entry->getStoragePath($options['useThumbnail']);
        $disposition = $options['disposition'];
        header("X-Sendfile: $path");
        header("Content-Type: {$entry->mime}");
        header(
            "Content-Disposition: $disposition; filename=\"" .
                $entry->getNameWithExtension() .
                '"',
        );
        exit();
    }
}
