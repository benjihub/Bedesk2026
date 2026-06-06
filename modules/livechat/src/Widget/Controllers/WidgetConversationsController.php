<?php

namespace Livechat\Widget\Controllers;

use Ai\AiAgent\Conversations\Streaming\EventEmitter;
use App\Conversations\Actions\ConversationListBuilder;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;
use Livechat\Chats\CreateChatAsCustomer;
use Livechat\Chats\StoreChatFormData;
use Livechat\Widget\HandleLatestUserMessage;
use Livechat\Widget\WidgetConversationLoader;
use App\Models\WidgetSession;

class WidgetConversationsController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index()
    {
        $closed = Conversation::STATUS_CLOSED;
        $pagination = Conversation::query()
            ->where('user_id', Auth::id())
            ->orderByRaw(
                "CASE WHEN status_category > $closed THEN 0 ELSE 1 END",
            )
            // shows latest chats first, then tickets
            ->orderBy('type', 'asc')
            ->orderBy('updated_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate(10);

        return $this->success([
            'pagination' => (new ConversationListBuilder())->cursorPagination(
                $pagination,
            ),
        ]);
    }

    public function show(int $conversationId)
    {
        $conversation = Conversation::with('user')->findOrFail($conversationId);

        $this->authorize('show', $conversation);

        return $this->success(
            (new WidgetConversationLoader())->loadDataFor($conversation),
        );
    }

    public function store()
    {
        $preChatForm = request('preChatForm');
        if ($preChatForm) {
            $data = [
                'preChatForm' => $preChatForm,
                'message' => request('message'),
                'flowId' => request('flowId'),
                'startWithGreeting' => request('startWithGreeting'),
                'department' => request('department'),
            ];
        } else {
            $data = request()->validate([
                'message.body' => 'required|string',
                'message.uuid' => 'string',
                'message.attachments' => 'array',
                'message.attachments.*' => 'int|exists:file_entries,id',
                'flowId' => 'int|nullable',
                'startWithGreeting' => 'bool',
                'department' => 'nullable',
            ]);
        }

        // If this visitor already has an open widget conversation, reuse it
        // instead of creating a new one. Prefer matching by persistent
        // visitorId so we don't depend on a specific auth user id.
        $visitorId = request()->header('X-Widget-Visitor') ?? request('visitorId');

        $existingQuery = Conversation::query()
            ->where('channel', 'widget');

        if (is_string($visitorId) && $visitorId !== '') {
            $existingQuery->whereHas('user.customAttributes', function ($query) use ($visitorId) {
                $query->where('key', 'visitorId')->where('value', $visitorId);
            });
        } else {
            $existingQuery->where('user_id', auth('chatWidget')->id());
        }

        $existing = $existingQuery->orderBy('id', 'desc')->first();

        if ($existing) {
            $this->authorize('show', $existing);

            // If conversation is closed, reopen it so new messages appear in
            // the same ticket instead of creating a fresh one.
            if ($existing->status_category <= Conversation::STATUS_CLOSED) {
                $openStatus = ConversationStatus::getDefaultOpen();
                Conversation::changeStatus($openStatus, [$existing]);
                $existing = $existing->fresh();
            }

            // If initial message was provided as part of create payload, submit it to existing chat.
            $msg = $data['message'] ?? null;
            if ($msg && (is_string($msg['body'] ?? '') || !empty($msg['attachments'] ?? []))) {
                try {
                    (new \App\Conversations\Customer\Actions\SubmitMessageAsCustomer())->execute($existing, $msg);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Widget create: failed to submit initial message to existing chat', [
                        'conversation_id' => $existing->id,
                        'error' => $e->getMessage(),
                        'payload' => $msg,
                    ]);
                }
            }

            $conversation = $existing->refresh();
        } else {
            try {
                $conversation = (new CreateChatAsCustomer())->execute($data);
            } catch (\Exception $e) {
                \Log::error('Error creating chat', ['error' => $e->getMessage(), 'data' => $data]);
                throw $e;
            }
        }

        // Persist last conversation id for this visitor so backend can
        // recover it even if client-side storage is cleared.
        if (is_string($visitorId) && $visitorId !== '') {
            WidgetSession::updateOrCreate(
                ['visitor_id' => $visitorId],
                ['last_conversation_id' => $conversation->id],
            );
        }

        $response = (new WidgetConversationLoader())->loadDataFor(
            $conversation,
        );

        return $this->stream(function () use ($response, $conversation) {
            EventEmitter::startStream();
            EventEmitter::conversationCreated($response);
            (new HandleLatestUserMessage($conversation))->execute();
            EventEmitter::endStream();
        });
    }

    public function submitFormData(int $chatId)
    {
        $data = request()->validate([
            'type' => 'required|string',
            'values' => 'array',
        ]);

        $conversation = Conversation::query()->findOrFail($chatId);

        $this->authorize('show', $conversation);

        $event = new ConversationsUpdated([$conversation]);

        $previousItem = $conversation->items()->orderBy('id', 'desc')->first();

        (new StoreChatFormData())->execute(
            $data['type'],
            $conversation,
            $data['values'],
        );

        // don't show the form anymore after user has submitted it already
        if ($previousItem->type === 'collectDetailsForm') {
            $previousItem->update([
                'body' => [...$previousItem->body, 'submitted' => true],
            ]);
        }

        if ($data['type'] === 'collectDetails') {
            (new HandleLatestUserMessage($conversation))->execute();
        }

        $event->dispatch(collect([$conversation->refresh()]));

        return $this->success();
    }
}
