<?php

namespace Ai\Controllers;

use Ai\AiAgent\Models\AiAgent;
use Ai\AiAgent\Models\AiAgentActivityLog;
use Common\Core\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AiAgentStatusController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('ai_agent.update');

        $groupId = $this->resolveGroupId($request);
        $agents = $this->scopedAgents($groupId)->get()->unique('name')->values();
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
        return AiAgent::query()->where(function ($query) use ($groupId) {
            if ($groupId) {
                $query->whereNull('group_id')->orWhere('group_id', $groupId);
                return;
            }

            $query->whereNull('group_id');
        })->orderByRaw(
            $groupId
                ? 'CASE WHEN group_id = ? THEN 0 ELSE 1 END'
                : 'id DESC',
            $groupId ? [$groupId] : [],
        );
    }

    protected function scopedLogs(?int $groupId)
    {
        return AiAgentActivityLog::query()->where(function ($query) use ($groupId) {
            if ($groupId) {
                $query->whereNull('group_id')->orWhere('group_id', $groupId);
                return;
            }

            $query->whereNull('group_id');
        })->orderByDesc('created_at');
    }

    protected function metricsForAgent(AiAgent $agent, Collection $logs, ?int $groupId): array
    {
        $agentLogs = $logs->filter(function (AiAgentActivityLog $log) use ($agent, $groupId) {
            if ((int) ($log->ai_agent_id ?? 0) === (int) $agent->id) {
                return true;
            }

            if (!$agent->group_id && !$groupId) {
                return $log->agent_name === $agent->name;
            }

            return !$log->ai_agent_id && $log->agent_name === $agent->name;
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
        $status = !$agent->enabled
            ? 'disconnected'
            : (($latestLog?->status ?? null) === 'error' ? 'error' : 'connected');
        $uptimePercent = $totalRequests > 0
            ? round(($successfulResponses / $totalRequests) * 100, 1)
            : null;

        return [
            'status' => $status,
            'total_requests' => $totalRequests,
            'successful_responses' => $successfulResponses,
            'response_time_ms' => $averageResponseTime,
            'uptime_percent' => $uptimePercent,
            'token_usage' => $tokenUsage,
            'last_activity_at' => $lastActivityAt,
            'error_message' => $latestLog?->error_message,
        ];
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
