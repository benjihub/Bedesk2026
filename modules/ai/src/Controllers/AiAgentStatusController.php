<?php

namespace Ai\Controllers;

use Ai\AiAgent\Models\AiAgent;
use Ai\AiAgent\Models\AiAgentActivityLog;
use Common\Core\BaseController;
use App\Conversations\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AiAgentStatusController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('ai_agent.update');

        $groupId = $this->resolveGroupId($request);
        $agents = $this->scopedAgents($groupId)->get()->values();
        $logs = $this->scopedLogs($groupId)->get();

        $agentStats = $agents->map(function (AiAgent $agent) use ($logs, $groupId) {
            $stats = $this->metricsForAgent($agent, $logs, $groupId);

            return [
                'id' => $agent->id,
                'group_id' => $agent->group_id,
                'name' => $agent->name,
                'image' => $agent->image,
                'enabled' => $agent->enabled,
                'personality' => $agent->personality,
                'greeting_type' => $agent->greeting_type,
                'initial_flow_id' => $agent->initial_flow_id,
                'basic_greeting_message' => $agent->basic_greeting_message,
                'basic_greeting_flow_ids' => $agent->basic_greeting_flow_ids,
                'transfer_instruction' => $agent->transfer_instruction,
                'cant_assist_instruction' => $agent->cant_assist_instruction,
                'status' => $stats['status'],
                'status_detail' => $stats['status_detail'],
                'total_requests' => $stats['total_requests'],
                'successful_responses' => $stats['successful_responses'],
                'response_time_ms' => $stats['response_time_ms'],
                'uptime_percent' => $stats['uptime_percent'],
                'token_usage' => $stats['token_usage'],
                'last_activity_at' => $stats['last_activity_at'],
                'error_message' => $stats['error_message'],
                'created_at' => $agent->created_at?->toISOString(),
                'updated_at' => $agent->updated_at?->toISOString(),
            ];
        });

        return $this->success([
            'summary' => $this->summarize($agentStats, $logs),
            'agents' => $agentStats,
            'refreshed_at' => now()->toISOString(),
        ]);
    }

    protected function resolveGroupId(Request $request): ?int
    {
        $groupId = $request->input('groupId', $request->query('groupId'));

        return is_numeric($groupId) ? (int) $groupId : null;
    }

    protected function scopedAgents(?int $groupId)
    {
        if ($groupId) {
            return AiAgent::query()
                ->whereNull('group_id')
                ->orWhere('group_id', $groupId)
                ->orderByRaw('CASE WHEN group_id = ? THEN 0 ELSE 1 END', [$groupId]);
        }

        return AiAgent::query()->orderByDesc('id');
    }

    protected function scopedLogs(?int $groupId)
    {
        if ($groupId) {
            return AiAgentActivityLog::query()
                ->whereNull('group_id')
                ->orWhere('group_id', $groupId)
                ->orderByDesc('created_at');
        }

        return AiAgentActivityLog::query()->orderByDesc('created_at');
    }

    protected function metricsForAgent(AiAgent $agent, Collection $logs, ?int $groupId): array
    {
        $agentLogs = $logs->filter(function (AiAgentActivityLog $log) use ($agent, $groupId) {
            if ((int) ($log->ai_agent_id ?? 0) === (int) $agent->id) {
                return true;
            }

            if ($log->ai_agent_id || $log->agent_name !== $agent->name) {
                return false;
            }

            if ($agent->group_id !== null) {
                return (int) ($log->group_id ?? 0) === (int) $agent->group_id;
            }

            return $log->group_id === null;
        })->values();

        $totalRequests = $agentLogs->count();
        $successfulResponses = $agentLogs->whereIn('status', ['success', 'fallback'])->count();
        $responseTimeValues = $agentLogs->pluck('response_time_ms')->filter(fn($value) => $value !== null);
        $averageResponseTime = $responseTimeValues->isNotEmpty()
            ? (int) round($responseTimeValues->avg())
            : null;
        $tokenUsage = (int) $agentLogs->sum(fn(AiAgentActivityLog $log) => (int) ($log->total_tokens ?? 0));
        $lastActivityAt = optional($agentLogs->first()?->created_at)->toISOString()
            ?? $agent->updated_at?->toISOString();
        $latestLog = $agentLogs->first();
        $hasLogs = $agentLogs->isNotEmpty();
        $activeWidget = $this->hasActiveWidgetConversation($agent, $groupId);
        $status = !$agent->enabled
            ? 'disconnected'
            : ($activeWidget
                ? 'connected'
                : (($latestLog?->status ?? null) === 'error'
                    ? 'error'
                    : 'disconnected'));
        $uptimePercent = $totalRequests > 0
            ? round(($successfulResponses / $totalRequests) * 100, 1)
            : null;
        $statusDetail = !$agent->enabled
            ? 'Agent is paused'
            : ($activeWidget
                ? 'Active widget is serving'
                : (($latestLog?->status ?? null) === 'error'
                    ? 'Latest run failed'
                    : ($hasLogs
                        ? 'No active widget conversation'
                        : 'No activity yet')));

        return [
            'status' => $status,
            'status_detail' => $statusDetail,
            'total_requests' => $totalRequests,
            'successful_responses' => $successfulResponses,
            'response_time_ms' => $averageResponseTime,
            'uptime_percent' => $uptimePercent,
            'token_usage' => $tokenUsage,
            'last_activity_at' => $lastActivityAt,
            'error_message' => $latestLog?->error_message,
        ];
    }

    protected function hasActiveWidgetConversation(AiAgent $agent, ?int $groupId): bool
    {
        $query = Conversation::query()
            ->where('channel', 'widget')
            ->whereNotClosed()
            ->where(function ($builder) {
                $builder->where('assigned_to', Conversation::ASSIGNED_BOT)
                    ->orWhere('ai_agent_involved', true);
            });

        if ($agent->group_id !== null) {
            $query->where('group_id', $agent->group_id);
        } elseif ($groupId !== null) {
            $query->where(function ($builder) use ($groupId) {
                $builder->whereNull('group_id')->orWhere('group_id', $groupId);
            });
        } else {
            $query->whereNull('group_id');
        }

        return $query->exists();
    }

    protected function summarize(Collection $agents, Collection $logs): array
    {
        $totalRequests = $agents->sum('total_requests');
        $successfulResponses = $agents->sum('successful_responses');
        $responseTimes = $agents->pluck('response_time_ms')->filter()->values();
        $tokenUsage = $agents->sum('token_usage');
        $lastActivity = $agents->pluck('last_activity_at')->filter()->sortDesc()->first();

        return [
            'total_agents' => $agents->count(),
            'connected_agents' => $agents->where('status', 'connected')->count(),
            'disconnected_agents' => $agents->where('status', 'disconnected')->count(),
            'error_agents' => $agents->where('status', 'error')->count(),
            'total_requests' => $totalRequests,
            'successful_responses' => $successfulResponses,
            'uptime_percent' => $totalRequests > 0
                ? round(($successfulResponses / $totalRequests) * 100, 1)
                : null,
            'average_response_time_ms' => $responseTimes->isNotEmpty()
                ? (int) round($responseTimes->avg())
                : null,
            'token_usage' => $tokenUsage,
            'last_activity_at' => $lastActivity,
            'log_count' => $logs->count(),
        ];
    }

}
