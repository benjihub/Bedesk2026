<?php namespace App\Conversations\Agent\Controllers;

use Ai\Summary\CreateConversationSummary;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

class ConversationsAssigneeController extends BaseController
{
    public function update()
    {
        $data = $this->validate(request(), [
            'conversationIds' => 'required|array|min:1',
            'conversationIds.*' => 'required|integer',
            'userId' => 'required|integer',
            'privateNote' => 'nullable|string',
            'shouldSummarize' => 'nullable|boolean',
        ]);

        $conversations = Conversation::whereIn(
            'id',
            $data['conversationIds'],
        )->get();

        $conversations->every(function (Conversation $conversation) {
            $this->authorize('update', $conversation);
        });

        // Prevent manual assignment of unassigned "Need Support" tickets.
        // These should only be auto-assigned by the system to ensure even distribution.
        $unassignedNeedSupportTickets = $conversations->filter(function (Conversation $conversation) {
            return $conversation->assignee_id === null &&
                $conversation->assigned_to === Conversation::ASSIGNED_AGENT &&
                $conversation->tags()->where('name', 'need-human-support')->exists();
        });

        if ($unassignedNeedSupportTickets->isNotEmpty()) {
            return response()->json([
                'message' => 'Unassigned "Need Human Support" tickets cannot be manually assigned. They will be automatically assigned to available agents.',
            ], 403);
        }

        $conversations = $conversations->filter(
            fn(Conversation $conversation) => $conversation->assignee_id !==
                $data['userId'],
        );

        // all conversations already assigned to this agent
        if ($conversations->isEmpty()) {
            return $this->success();
        }

        $conversations->each(function (Conversation $conversation, $index) use (
            $data,
        ) {
            if (isset($data['privateNote'])) {
                (new CreateConversationMessage())->execute($conversation, [
                    'body' => $data['privateNote'],
                    'type' => 'note',
                    'author' => Conversation::AUTHOR_AGENT,
                    'user_id' => Auth::id(),
                ]);
            }

            // only create summary for first conversation, as this can take a few seconds and button
            // to summarize should be hidden on frontend if multiple conversations are selected
            if (Arr::get($data, 'shouldSummarize') && $index === 0) {
                try {
                    (new CreateConversationSummary())->execute($conversation);
                } catch (\Exception $e) {
                    //
                }
            }
        });

        ConversationsAssigner::assignConversationsToAgent(
            $conversations,
            $data['userId'],
            addEvent: true,
        );

        return $this->success();
    }
}
