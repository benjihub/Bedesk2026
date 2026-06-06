<?php

namespace App\Conversations\Actions;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Traits\BuildsConversationResources;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class PaginateConversationItems
{
    use BuildsConversationResources;

    public function execute(Conversation $conversation): array
    {
        $paginator = $conversation
            ->items()
            ->with(['user.secondaryEmail', 'attachments'])
            ->when(
                !Auth::user()->isAgent(),
                fn(Builder $builder) => $builder->where(
                    'type',
                    '!=',
                    ConversationItem::NOTE_TYPE,
                ),
            )
            ->orderBy('id', 'desc')
            ->cursorPaginate(15);

        $data = $paginator
            ->getCollection()
            ->reverse()
            // messages are displayed in chat feed interface, so we need
            // to show the latest message within pagination window last
            ->values();

        $data = $data->map(
            fn(ConversationItem $item) => [
                'id' => $item->id,
                'uuid' => $item->uuid,
                'type' => $item->type,
                'author' => $item->author,
                'body' => $item->body,
                'created_at' => $item->created_at,
                'user' => $item->user
                    ? [
                        'id' => $item->user_id,
                        'name' => $item->user->name,
                        'image' => $item->user->image,
                    ]
                    : null,
                'conversation_id' => $item->conversation_id,
                'source' => $item->email_id ? 'email' : null,
                'data' => $item->data,
                'attachments' => static::buildAttachmentList(
                    $item->attachments,
                ),
            ],
        );

        return $this->buildCursorPagination($paginator, $data);
    }
}
