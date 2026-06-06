<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Actions\ConversationListBuilder;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class AgentConversationListController extends BaseController
{
    public function __invoke(int $agentId)
    {
        $this->authorize('index', Conversation::class);

        $paginator = Conversation::where(
            'assignee_id',
            $agentId,
        )->cursorPaginate(25);

        $pagination = (new ConversationListBuilder())->cursorPagination(
            $paginator,
        );

        return $this->success(['pagination' => $pagination]);
    }
}
