<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Actions\PaginateConversationItems;
use App\Conversations\Agent\Actions\SubmitMessageAsAgent;
use App\Conversations\Events\ConversationTyping;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Common\Core\BaseController;
use Illuminate\Http\Response;

class AgentMessagesController extends BaseController
{
    public function index(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('show', $conversation);

        $pagination = (new PaginateConversationItems())->execute($conversation);

        return $this->success([
            'pagination' => $pagination,
        ]);
    }

    public function store(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('update', $conversation);

        $data = request()->validate([
            'body' => 'required|string|min:1',
            'type' => 'required|string|in:note,message',
            'uuid' => 'string',
            'status_id' => 'nullable|int',
            'attachments' => 'array|max:10',
            'attachments.*' => 'int',
            'tags' => 'array',
            'tags.*' => 'int',
        ]);

        if (
            $conversation->status_category <= Conversation::STATUS_CLOSED &&
            $data['type'] === 'message'
        ) {
            return response()->json(
                ['message' => 'Conversation is closed.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        $message = (new SubmitMessageAsAgent())->execute($conversation, $data);

        return $this->success(['message' => $message], 201);
    }

    public function update(int $messageId)
    {
        $message = ConversationItem::findOrFail($messageId);

        $this->authorize('update', $message->conversation);

        $updatedEvent = new ConversationsUpdated([$message->conversation]);

        $data = $this->validate(request(), [
            'body' => 'string|min:1',
            'attachments' => 'array|max:5|exists:file_entries,id',
        ]);

        if (isset($data['body'])) {
            $message->body = $data['body'];
        }

        if (isset($data['attachments'])) {
            $message->attachments()->sync($data['attachments']);
        }

        $message->save();
        $message->syncInlineImages();

        $updatedEvent->dispatch([$message->conversation]);

        return $this->success(['message' => $message]);
    }

    public function destroy(int $messageId)
    {
        $message = ConversationItem::findOrFail($messageId);

        $this->blockOnDemoSite();
        $this->authorize('update', $message->conversation);

        $updatedEvent = new ConversationsUpdated([$message->conversation]);

        $message->attachments()->detach();
        $message->delete();

        $updatedEvent->dispatch([$message->conversation]);

        return $this->success();
    }

    public function typing(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('update', $conversation);

        $data = request()->validate([
            'is_typing' => 'required|boolean',
        ]);

        event(new ConversationTyping($conversation, 'agent', $data['is_typing']));

        return $this->success();
    }
}
