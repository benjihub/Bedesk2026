<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Actions\ConversationEventsCreator;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;

class ConversationsStatusController extends BaseController
{
    public function update()
    {
        $data = $this->validate(request(), [
            'conversationIds' => 'required|array',
            'statusId' => 'int',
            'statusName' => 'string|in:open,closed',
        ]);

        $conversations = Conversation::whereIn('id', $data['conversationIds'])
            ->with(['status'])
            ->get();

        $conversations->every(function (Conversation $conversation) {
            $this->authorize('update', $conversation);
        });

        $status = $this->resolveStatus($data);

        if (!$status) {
            return $this->error(__('Status not found'));
        }

        $updatedEvent = new ConversationsUpdated($conversations);

        Conversation::changeStatus($status, $conversations);

        if ($status->category === Conversation::STATUS_CLOSED) {
            foreach ($conversations as $conversation) {
                (new ConversationEventsCreator($conversation))->closedByAgent(
                    Auth::user(),
                );
            }
        }

        $conversations->each(function ($conversation) {
            ConversationsAssigner::drainQueueIfNeeded($conversation->group_id);
        });

        $updatedEvent->dispatch($conversations);

        return $this->success();
    }

    protected function resolveStatus(array $data): ConversationStatus|null
    {
        if (isset($data['statusId'])) {
            return ConversationStatus::findOrFail($data['statusId']);
        }

        // get the open/closed status that was created first
        if (isset($data['statusName'])) {
            if ($data['statusName'] === 'open') {
                return ConversationStatus::getDefaultOpen();
            }

            if ($data['statusName'] === 'closed') {
                return ConversationStatus::getDefaultClosed();
            }
        }

        return null;
    }
}
