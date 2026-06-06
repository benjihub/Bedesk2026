<?php

namespace App\HelpCenter\Controllers;

use App\HelpCenter\Models\HcArticle;
use Common\Core\BaseController;
use Common\Files\FileEntry;
use Common\Files\Response\DownloadFilesResponse;

class HcArticleAttachmentsController extends BaseController
{
    public function download(int $articleId, string $entryHash)
    {
        $this->authorize('index', HcArticle::class);

        $entryId = app(FileEntry::class)->decodeHash($entryHash);

        $article = HcArticle::findOrFail($articleId);
        $entry = $article
            ->attachments()
            ->where('file_entries.id', $entryId)
            ->select('file_entries.*')
            ->firstOrFail();

        return app(DownloadFilesResponse::class)->create(collect([$entry]));
    }
}
