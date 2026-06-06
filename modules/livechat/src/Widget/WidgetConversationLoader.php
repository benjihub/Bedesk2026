<?php

namespace Livechat\Widget;

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Actions\PaginateConversationItems;
use App\Conversations\Models\Conversation;
use App\Models\User;
use App\Models\WidgetSession;
use App\Team\Models\Group;
use Illuminate\Support\Arr;

class WidgetConversationLoader
{
    public function activeConversationFor(
        User $customer,
        int|null $conversationId = null,
    ): array|null {
        // Resolve the requested department/group so every resume path can
        // filter by it, preventing conversations from one embedded site
        // leaking into another site's widget when the same browser session
        // is reused across tabs.
        $requestedGroupId = $this->resolveGroupId(request('department'));

        if ($conversationId) {
            // Prefer an explicit conversation id from loader (iframe
            // query). This is tied to visitorId in the loader, so try to
            // resolve it even if the conversation's user id does not
            // currently match the authenticated customer, as long as the
            // owner has the same visitorId attribute.
            $conversation = Conversation::query()
                ->whereNotClosed()
                ->find($conversationId);

            if ($conversation) {
                $visitorId = request()->header('X-Widget-Visitor') ?? request(
                    'visitorId',
                );
                if ($visitorId) {
                    $owner = $conversation->user;
                    $ownerVisitorId = $owner
                        ? $owner
                            ->customAttributes()
                            ->where('key', 'visitorId')
                            ->value('value')
                        : null;

                    // If visitor ids don't match, don't expose this
                    // conversation as active for this widget session.
                    if ($ownerVisitorId !== $visitorId) {
                        $conversation = null;
                    }
                } elseif ($conversation->user_id !== $customer->id) {
                    // No visitor id info, fall back to strict user match.
                    $conversation = null;
                }
            }
        }

        // If no explicit id provided, try to restore from widget_sessions
        // using persistent visitor id so conversations can resume even if
        // client-side storage did not pass conversationId.
        if (!isset($conversation)) {
            $visitorId = request()->header('X-Widget-Visitor') ?? request(
                'visitorId',
            );
            if (is_string($visitorId) && $visitorId !== '') {
                $session = WidgetSession::where('visitor_id', $visitorId)
                    ->whereNotNull('last_conversation_id')
                    ->first();
                if ($session) {
                    $candidate = Conversation::query()
                        ->whereNotClosed()
                        ->find($session->last_conversation_id);
                    // Only reuse this session's conversation if it belongs to
                    // the same group as the currently requested department.
                    // This prevents a Sakaw session from resuming inside a BWD
                    // widget when both share the same browser.
                    $groupMatches = $requestedGroupId === null
                        || $candidate?->group_id === $requestedGroupId;
                    if ($candidate && $candidate->user_id === $customer->id && $groupMatches) {
                        $conversation = $candidate;
                    }
                }
            }
        }

        if (!isset($conversation)) {
            $query = $customer
                ->conversations()
                ->whereNotClosed();

            // Scope to the requested group so a cross-site session reuse
            // never reopens a conversation from a different group/department.
            if ($requestedGroupId !== null) {
                $query->where('group_id', $requestedGroupId);
            }

            $conversation = $query
                ->orderByRaw('FIELD(type, "chat", "ticket")')
                ->orderBy('id', 'desc')
                ->first();
        }

        if ($conversation) {
            return $this->loadDataFor($conversation);
        }

        return null;
    }

    public function loadDataFor(Conversation $conversation): array
    {
        $pagination = (new PaginateConversationItems())->execute($conversation);

        $hasPostChatForm = collect($pagination['data'])->first(
            fn($msg) => $msg['type'] === 'submittedFormData' &&
                $msg['body']['formType'] === 'postChat',
        );

        $attributes = $conversation
            ->customAttributes()
            ->where('materialized', false)
            ->where(
                'permission',
                '!=',
                CustomAttribute::PERMISSION_AGENT_CAN_EDIT,
            )
            ->get()
            ->map(
                fn(CustomAttribute $attribute) => $attribute->toCompactArray(
                    'customer',
                ),
            );

        $data = [
            'conversation' => [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'status_category' => $conversation->status_category,
                'status' =>
                    $conversation->status->user_label ??
                    $conversation->status->label,
                'priority' => $conversation->priority,
                'updated_at' => $conversation->updated_at,
                'created_at' => $conversation->created_at,
                'subject' => $conversation->subject,
                'user' => $conversation->user
                    ? [
                        'id' => $conversation->user->id,
                        'name' => $conversation->user->name,
                        'image' => $conversation->user->image,
                    ]
                    : null,
                'assigned_to' => $conversation->assigned_to,
                'assignee_id' => $conversation->assignee_id,
                'assignee' => $conversation->assignee
                    ? [
                        'id' => $conversation->assignee->id,
                        'name' => $conversation->assignee->name,
                        'image' => $conversation->assignee->image,
                    ]
                    : null,
            ],
            'items' => $pagination,
            'hasPostChatForm' => $hasPostChatForm,
            'attributes' => $attributes,
        ];

        if (
            $conversation->type !== 'ticket' &&
            $conversation->status_category >= Conversation::STATUS_OPEN &&
            !$conversation->assignee_id
        ) {
            $data['queuedChatInfo'] = $this->getQueuedChatInfo(
                $conversation->id,
            );
        }

        return $data;
    }

    /**
     * Resolve a department value (group name or numeric id) to a Group id,
     * returning null when no department is specified or the group is not found.
     */
    protected function resolveGroupId(string|null $department): int|null
    {
        if (!$department) {
            return null;
        }

        $group = is_numeric($department)
            ? Group::find((int) $department)
            : Group::where('name', $department)->first();

        return $group?->id;
    }

    protected function getQueuedChatInfo(int $chatId): array
    {
        $allQueuedChats = Conversation::query()
            ->whereNotClosed()
            ->where('assignee_id', null)
            ->pluck('id');

        $waitTimePerChat = 5;
        $index = $allQueuedChats->search($chatId);

        return [
            'estimatedWaitTime' => !$index
                ? $waitTimePerChat
                : $waitTimePerChat * $index,
            'positionInQueue' => $index + 1,
        ];
    }
}
