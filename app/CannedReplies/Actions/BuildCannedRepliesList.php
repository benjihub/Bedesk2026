<?php

namespace App\CannedReplies\Actions;

use App\CannedReplies\Models\CannedReply;
use App\Conversations\Traits\BuildsConversationResources;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Support\Str;

class BuildCannedRepliesList
{
    use BuildsConversationResources;

    public function execute(AbstractPaginator $pagination): array
    {
        $data = array_map(
            fn(CannedReply $reply) => [
                'id' => $reply->id,
                'name' => $reply->name,
                'shortcut' => $reply->shortcut,
                'description' => Str::limit(strip_tags($reply->body), 100),
                'body' => $reply->body,
                'shared' => $reply->shared,
                'updated_at' => $reply->updated_at,
                'group_id' => $reply->group_id,
                'attachments' => static::buildAttachmentList(
                    $reply->attachments,
                ),
                'tags' => $reply->tags->map(function ($tag) {
                    return [
                        'id' => $tag->id,
                        'name' => $tag->name,
                    ];
                }),
                'user' => [
                    'id' => $reply->user->id,
                    'name' => $reply->user->name,
                    'image' => $reply->user->image,
                ],
            ],
            $pagination->items(),
        );

        return $this->buildSimplePagination($pagination, $data);
    }
}
