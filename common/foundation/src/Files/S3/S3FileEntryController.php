<?php

namespace Common\Files\S3;

use Common\Core\BaseController;
use Common\Files\Actions\CreateFileEntry;
use Common\Files\Events\FileUploaded;
use Common\Files\FileEntry;
use Common\Files\FileEntryPayload;

class S3FileEntryController extends BaseController
{
    public function store()
    {
        $validatedData = $this->validate(request(), [
            'clientExtension' => 'required|string',
            'clientMime' => 'nullable|string|max:255',
            'clientName' => 'required|string',
            'clientSize' => 'required|int',
            'filename' => 'required|string',
            'parentId' => 'nullable|exists:file_entries,id',
            'relativePath' => 'nullable|string',
            'workspaceId' => 'nullable|int',
            'uploadType' => 'required|string',
            'backendId' => 'required|string',
        ]);

        $payload = new FileEntryPayload($validatedData);

        $this->authorize('store', [FileEntry::class, $payload->parentId]);

        $fileEntry = (new CreateFileEntry())->execute($payload);

        $fileEntry = $payload->uploadType->runHandler(
            $fileEntry,
            $validatedData,
        );

        event(new FileUploaded($fileEntry));

        return $this->success(['fileEntry' => $fileEntry]);
    }
}
