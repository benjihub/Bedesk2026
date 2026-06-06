<?php

namespace App\Team\Controllers;

use App\Contacts\Models\PageVisit;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Team\Models\GroupPromotion;
use Common\Core\BaseController;

class DashboardStatsController extends BaseController
{
    public function index()
    {
        try {
            // authorize inside try so authorization failures are returned as JSON
            $this->authorize('index', Conversation::class);

            // Count realtime active agents (users with a recently-updated session)
            // Only count agents active within the last 10 seconds as requested
            $activeUsers = \App\Models\User::whereAgent()
                ->whereHas('latestUserSession', function ($q) {
                    // 10s window
                    $q->where('updated_at', '>=', now()->subSeconds(10));
                })
                ->count();

            $openTickets = Conversation::query()
                ->where('status_category', '>', Conversation::STATUS_CLOSED)
                ->count();

            $totalTickets = Conversation::query()->count();

            $aiResponses = ConversationItem::query()
                ->where('type', 'message')
                ->where('author', Conversation::AUTHOR_BOT)
                ->count();

            $promotions = GroupPromotion::query()->where('active', true)->count();

            return $this->success([
                'active_users' => $activeUsers,
                'open_tickets' => $openTickets,
                'total_tickets' => $totalTickets,
                'ai_responses' => $aiResponses,
                'promotions' => $promotions,
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            // Return JSON 403 for unauthorized
            return $this->error('unauthorized', 403);
        } catch (\Throwable $e) {
            // Log error so we can inspect why production returns empty values
            logger()->error('DashboardStatsController@index failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return safe defaults so the frontend can render without 500
            return $this->success([
                'active_users' => 0,
                'open_tickets' => 0,
                'total_tickets' => 0,
                'ai_responses' => 0,
                'promotions' => 0,
                'error' => 'failed_to_compute_stats',
            ]);
        }
    }
}
