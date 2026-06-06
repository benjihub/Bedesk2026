<?php

namespace Common\Files\Response;

use Common\Files\FileEntry;

interface FileResponse
{
    public function make(FileEntry $entry, array $options);
}
