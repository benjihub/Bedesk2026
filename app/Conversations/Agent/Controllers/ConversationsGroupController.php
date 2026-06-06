<?php namespace App\Conversations\Agent\Controllers;

use Ai\Summary\CreateConversationSummary;
use App\Conversations\Agent\Actions\AssignConversationsToGroup;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Team\Models\Group;
use Common\Core\BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

class ConversationsGroupController extends BaseController
{
    public function update()
    {
        $data = $this->validate(request(), [
            'conversationIds' => 'required|array|min:1',
            'conversationIds.*' => 'required|integer',
            'groupId' => 'required|integer',
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

        $conversations = $conversations->filter(
            fn(Conversation $conversation) => $conversation->group_id !==
                $data['groupId'],
        );

        // all conversations already assigned to this group
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

        $group = Group::find($data['groupId']);
        (new AssignConversationsToGroup())->execute(
            $conversations,
            $group,
            addEvent: true,
        );

        // assign conversations to first available agent, if needed
        if ($group->assignment_mode === 'auto') {
            $conversations->each(function (Conversation $conversation) {
                if (!$conversation->assignee_id) {
                    ConversationsAssigner::assignConversationToFirstAvailableAgent(
                        $conversation,
                        addEvent: true,
                    );
                }
            });
        }

        return $this->success();
    }
}
