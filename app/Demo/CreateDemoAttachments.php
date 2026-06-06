<?php

namespace App\Demo;

use App\Conversations\Models\Conversation;
use Common\Files\Actions\CreateFileEntry;
use Common\Files\Actions\StoreFile;
use Common\Files\FileEntryPayload;

class CreateDemoAttachments
{
    public function execute()
    {
        $data = [
            [
                'clientName' => 'image-1.jpg',
                'clientSize' => '125646',
                'clientMime' => 'image/jpeg',
                'extension' => 'jpg',
                'type' => 'image',
            ],
            [
                'clientName' => 'doc-1.xls',
                'clientSize' => '56832',
                'clientMime' => 'application/vnd.ms-excel',
                'extension' => 'xls',
                'type' => 'spreadsheet',
            ],
            [
                'clientName' => 'audio-1.mp3',
                'clientSize' => '1939540',
                'clientMime' => 'audio/mpeg',
                'extension' => 'mp3',
                'type' => 'audio',
            ],
            [
                'clientName' => 'image-2.jpg',
                'clientSize' => '42657',
                'clientMime' => 'image/jpeg',
                'extension' => 'jpg',
                'type' => 'image',
            ],
            [
                'clientName' => 'doc-2.pptx',
                'clientSize' => '413895',
                'clientMime' =>
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'extension' => 'pptx',
                'type' => 'powerPoint',
            ],
            [
                'clientName' => 'video-1.mp4',
                'clientSize' => '1173924',
                'clientMime' => 'video/mp4',
                'extension' => 'mp4',
                'type' => 'video',
            ],
            [
                'clientName' => 'image-3.jpg',
                'clientSize' => '53205',
                'clientMime' => 'image/jpeg',
                'extension' => 'jpg',
                'type' => 'image',
            ],
            [
                'clientName' => 'doc-3.doc',
                'clientSize' => '71680',
                'clientMime' => 'application/msword',
                'extension' => 'doc',
                'type' => 'word',
            ],
        ];

        foreach ($data as $item) {
            $payload = new FileEntryPayload([
                ...$item,
                'uploadType' => Conversation::ATTACHMENT_UPLOAD_TYPE,
            ]);

            (new StoreFile())->execute($payload, [
                'contents' => file_get_contents(
                    public_path() . '/demo-files/' . $item['clientName'],
                ),
            ]);
            (new CreateFileEntry())->execute($payload);
        }
    }
}
