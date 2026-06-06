<?php

namespace App\Conversations\Actions;

use App\Conversations\Models\Conversation;
use App\Conversations\Traits\BuildsConversationResources;
use Common\Tags\Tag;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Support\Collection;

class ConversationListBuilder
{
    use BuildsConversationResources;

    public function simplePagination(AbstractPaginator $paginator): array
    {
        $paginator = $this->loadRelations($paginator);

        $pagination = $this->buildSimplePagination(
            $paginator,
            $this->buildData($paginator),
        );

        return $pagination;
    }

    public function cursorPagination(CursorPaginator $paginator)
    {
        $paginator = $this->loadRelations($paginator);

        return $this->buildCursorPagination(
            $paginator,
            $this->buildData($paginator),
        );
    }

    protected function buildData(
        AbstractPaginator|CursorPaginator $paginator,
    ): Collection {
        return $paginator
            ->getCollection()
            ->map(function (Conversation $conversation) {
                $data = [
                    'id' => $conversation->id,
                    'type' => $conversation->type,
                    'priority' => $conversation->priority,
                    'channel' => $conversation->channel,
                    'subject' => $conversation->subject,
                    'latest_message' => $conversation->latestMessage
                        ? [
                            'body' => $conversation->latestMessage->makeBodyCompact(
                                280,
                            )?->body,
                            'author' => $conversation->latestMessage->author,
                            'user' => $conversation->latestMessage->user
                                ? [
                                    'id' =>
                                        $conversation->latestMessage->user_id,
                                    'name' =>
                                        $conversation->latestMessage->user
                                            ?->name,
                                    'image' =>
                                        $conversation->latestMessage->user
                                            ?->image,
                                ]
                                : null,
                            'created_at' =>
                                $conversation->latestMessage->created_at,
                        ]
                        : null,
                    'status_category' => $conversation->status_category,
                    'status_label' => $conversation->status?->label,
                    'customer_status_label' =>
                        $conversation->status?->user_label,
                    'group' => $conversation->group
                        ? [
                            'id' => $conversation->group->id,
                            'name' => $conversation->group->name,
                        ]
                        : null,
                    'assignee' => $conversation->assignee
                        ? [
                            'id' => $conversation->assignee->id,
                            'name' => $conversation->assignee->name,
                            'image' => $conversation->assignee->image,
                            'email' => $conversation->assignee->email,
                        ]
                        : null,
                    'user' => $conversation->user
                        ? [
                            'id' => $conversation->user->id,
                            'name' => $conversation->user->name,
                            'image' => $conversation->user->image,
                            'email' => $conversation->user->email,
                            'city' =>
                                $conversation->user->latestUserSession?->city,
                        ]
                        : null,
                    'tags' => $conversation->tags->map(
                        fn(Tag $tag) => [
                            'id' => $tag->id,
                            'name' => $tag->display_name ?? $tag->name,
                        ],
                    ),
                    'updated_at' => $conversation->updated_at,
                    'created_at' => $conversation->created_at,
                    'closed_at' => $conversation->closed_at,
                    'assigned_at' => $conversation->assigned_at,
                    'closed_by' => $conversation->closed_by,
                ];

                if ($conversation->relationLoaded('customAttributes')) {
                    $data['attributes'] = $conversation->customAttributes->mapWithKeys(
                        fn($attribute) => [
                            $attribute->key => $attribute->value,
                        ],
                    );
                }

                return $data;
            });
    }

    protected function loadRelations(
        CursorPaginator|AbstractPaginator $paginator,
    ) {
        $paginator->load([
            'latestMessage.user',
            'user.latestUserSession' => fn($q) => $q->select('*'),
            'assignee',
            'group',
            'tags',
            'status',
            'aiAgentSession',
        ]);

        return $paginator;
    }
}
