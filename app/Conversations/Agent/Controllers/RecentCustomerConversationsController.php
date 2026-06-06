<?php

namespace App\Conversations\Agent\Controllers;

use App\Conversations\Models\Conversation;
use App\Models\User;
use Common\Core\BaseController;

class RecentCustomerConversationsController extends BaseController
{
    public function __invoke(int $userId)
    {
        $this->authorize('index', Conversation::class);

        $excludeId = request('excludeId');

        $conversations = User::findOrFail($userId)
            ->conversations()
            ->when(
                $excludeId,
                fn($query) => $query->where('id', '!=', $excludeId),
            )
            ->with(['latestMessage'])
            ->limit(6)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function (Conversation $conversation) {
                return [
                    'id' => $conversation->id,
                    'subject' => $conversation->subject,
                    'description' => $conversation->latestMessage?->makeBodyCompact()
                        ?->body,
                    'type' => $conversation->type,
                    'created_at' => $conversation->created_at,
                    'status_category' => $conversation->status_category,
                ];
            });

        return $this->success([
            'conversations' => $conversations,
        ]);
    }
}
