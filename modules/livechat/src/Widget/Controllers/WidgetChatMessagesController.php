<?php

namespace Livechat\Widget\Controllers;

use Ai\AiAgent\Conversations\Streaming\EventEmitter;
use App\Conversations\Actions\PaginateConversationItems;
use App\Conversations\Customer\Actions\SubmitMessageAsCustomer;
use App\Conversations\Events\ConversationTyping;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Common\Core\BaseController;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Livechat\Widget\HandleLatestUserMessage;
use Illuminate\Support\Facades\Log;

class WidgetChatMessagesController extends BaseController
{
    public function index(int $chatId)
    {
        try {
            $conversation = Conversation::findOrFail($chatId);

            $this->authorize('show', $conversation);

            $pagination = (new PaginateConversationItems())->execute(
                $conversation,
            );

            return $this->success(['pagination' => $pagination]);
        } catch (ModelNotFoundException $e) {
            return $this->error('Chat not found', [], 404);
        } catch (AuthorizationException $e) {
            return $this->error('Forbidden', [], 403);
        } catch (\Throwable $e) {
            Log::error('Widget messages index failed', [
                'conversation_id' => $chatId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->error('Failed to load messages', [], 500);
        }
    }

    public function store(int $conversationId)
    {
        try {
            $conversation = Conversation::findOrFail($conversationId);

            $this->authorize('show', $conversation);

            $attachments = request('message.attachments', []);
            $data = $this->validate(request(), [
                'message.body' => !count($attachments) ? 'required|string' : '',
                'message.uuid' => 'string',
                'message.attachments' => 'required_without:message.body|array',
                'message.attachments.*' => 'int|exists:file_entries,id',
            ]);
        } catch (ModelNotFoundException $e) {
            return $this->error('Chat not found', [], 404);
        } catch (AuthorizationException $e) {
            return $this->error('Forbidden', [], 403);
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), $e->errors(), 422);
        } catch (\Throwable $e) {
            Log::error('Widget message store bootstrap failed', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => request()->all(),
            ]);
            return $this->error('Failed to submit message', [], 500);
        }

        // Persist the user message. If a downstream event listener throws,
        // we still want the widget request to succeed and allow AI to reply.
        $messageUuid = $data['message']['uuid'] ?? null;
        $previousMaxItemId = (int) ($conversation->items()->max('id') ?? 0);
        try {
            (new SubmitMessageAsCustomer())->execute(
                $conversation,
                $data['message'],
            );
        } catch (\Throwable $e) {
            Log::error('Widget message store failed during SubmitMessageAsCustomer', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => request()->all(),
            ]);

            // If the message was still created (but an event/listener later
            // failed), continue and let AI attempt to respond. Otherwise,
            // return a real 500.
            $savedMessage = null;
            if (is_string($messageUuid) && $messageUuid !== '') {
                $savedMessage = ConversationItem::query()
                    ->where('conversation_id', $conversationId)
                    ->where('uuid', $messageUuid)
                    ->first();
            }

            $currentMaxItemId = (int) (ConversationItem::query()
                ->where('conversation_id', $conversationId)
                ->max('id') ?? 0);

            $messageWasCreated = $savedMessage || $currentMaxItemId > $previousMaxItemId;

            if (!$messageWasCreated) {
                return $this->error('Failed to submit message', [], 500);
            }
        }

        return $this->stream(function () use ($conversationId) {
            EventEmitter::startStream();

            try {
                $conversation = Conversation::find($conversationId);
                if (!$conversation) {
                    EventEmitter::error('Chat not found.');
                    return;
                }

                (new HandleLatestUserMessage($conversation))->execute();
            } catch (\Throwable $e) {
                Log::error('Widget AI stream failed', [
                    'conversation_id' => $conversationId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                EventEmitter::error('AI failed to respond.');
            } finally {
                EventEmitter::endStream();
            }
        });
    }

    public function typing(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('show', $conversation);

        $data = request()->validate([
            'is_typing' => 'required|boolean',
        ]);

        try {
            event(
                new ConversationTyping(
                    $conversation,
                    'user',
                    $data['is_typing'],
                ),
            );
        } catch (\Throwable $e) {
            Log::warning('Widget typing broadcast failed', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->success();
    }
}
