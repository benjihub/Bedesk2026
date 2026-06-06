<?php

namespace App\Conversations\Traits;

use Common\Files\FileEntry;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Pagination\AbstractPaginator;

trait BuildsConversationResources
{
    public function buildSimplePagination(
        AbstractPaginator $paginator,
        iterable $data,
    ): array {
        $pagination = [
            'data' => $data,
            'current_page' => $paginator->currentPage(),
            'from' => $paginator->firstItem(),
            'next_page' => $paginator->hasMorePages()
                ? $paginator->currentPage() + 1
                : null,
            'per_page' => $paginator->perPage(),
            'prev_page' =>
                $paginator->currentPage() > 1
                    ? $paginator->currentPage() - 1
                    : null,
            'to' => $paginator->lastItem(),
        ];

        if (method_exists($paginator, 'lastPage')) {
            $pagination['last_page'] = $paginator->lastPage();
            $pagination['total'] = $paginator->total();
        }

        return $pagination;
    }

    public function buildCursorPagination(
        CursorPaginator $paginator,
        iterable $data,
    ): array {
        return [
            'data' => $data,
            'next_cursor' => $paginator->nextCursor()?->encode(),
            'prev_cursor' => $paginator->previousCursor()?->encode(),
            'per_page' => $paginator->perPage(),
        ];
    }

    public static function buildAttachmentList(iterable $attachments): iterable
    {
        return $attachments->map(
            fn(FileEntry $attachment) => [
                'id' => $attachment->id,
                'name' => $attachment->name,
                'file_name' => $attachment->file_name,
                'file_size' => $attachment->file_size,
                'mime' => $attachment->mime,
                'extension' => $attachment->extension,
                'type' => $attachment->type,
                'url' => $attachment->url,
                'hash' => $attachment->hash,
            ],
        );
    }
}
