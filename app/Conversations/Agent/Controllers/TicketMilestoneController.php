<?php

namespace App\Conversations\Agent\Controllers;

use App\Conversations\Actions\GetTicketMilestones;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class TicketMilestoneController extends BaseController
{
    public function show(int $id)
    {
        $this->authorize('show', 'ReportPolicy');

        $conversation = Conversation::where('type', 'ticket')->findOrFail($id);

        return $this->success(
            app(GetTicketMilestones::class)->execute($conversation),
        );
    }
}
