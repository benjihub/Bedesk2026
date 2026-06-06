<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Email\EmailStore;
use App\Conversations\Models\ConversationItem;
use Common\Core\BaseController;

class OriginalReplyEmailController extends BaseController
{
    public function show(int $messageId)
    {
        $message = ConversationItem::findOrFail($messageId);

        $this->authorize('show', $message->conversation);

        $original = (new EmailStore())->getEmailForReply($message);

        return $this->success(['email' => $original]);
    }

    public function download(int $messageId)
    {
        $message = ConversationItem::findOrFail($messageId);

        $this->authorize('show', $message->conversation);

        return (new EmailStore())->download($message);
    }
}
