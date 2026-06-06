<?php namespace App\Conversations\Customer\Controllers;

use App\Conversations\Actions\PaginateConversationItems;
use App\Conversations\Customer\Actions\SubmitMessageAsCustomer;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class CustomerMessagesController extends BaseController
{
    public function index(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('show', $conversation);

        $pagination = (new PaginateConversationItems())->execute(
            $conversation,
        );

        return $this->success([
            'pagination' => $pagination,
        ]);
    }

    public function store(int $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        $this->authorize('reply', $conversation);

        $data = request()->validate([
            'body' => 'string|min:1',
            'attachments' => 'array|max:10',
            'attachments.*' => 'int',
        ]);

        if ($conversation->status_category <= Conversation::STATUS_LOCKED) {
            return $this->error(
                __('This ticket is locked. To reply, create a new ticket.'),
            );
        }

        $message = (new SubmitMessageAsCustomer())->execute(
            $conversation,
            $data,
        );

        return $this->success(['message' => $message], 201);
    }
}
