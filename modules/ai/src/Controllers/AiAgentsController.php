<?php

namespace Ai\Controllers;

use Ai\AiAgent\Models\AiAgent;
use Common\Core\BaseController;
use Illuminate\Http\Request;

class AiAgentsController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('ai_agent.update');

        $perPage = $request->get('perPage', 15);
        $agents = $this->scopedQuery($request)
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return $this->success([
            'pagination' => $agents,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('ai_agent.update');

        $data = $this->validate($request, [
            'groupId' => 'sometimes|nullable|integer|exists:groups,id',
            'name' => 'required|string|max:255',
            'image' => 'nullable|string',
            'enabled' => 'sometimes|boolean',
            'personality' => 'nullable|string',
            'greeting_type' => 'nullable|string',
            'initial_flow_id' => 'nullable|integer|exists:ai_agent_flows,id',
            'basic_greeting_message' => 'nullable|string',
            'basic_greeting_flow_ids' => 'nullable|array',
            'transfer_instruction' => 'nullable|string',
            'cant_assist_instruction' => 'nullable|string',
        ]);

        $agent = AiAgent::create([
            ...$data,
            'group_id' => $this->resolveGroupId($request),
        ]);

        return $this->success(['agent' => $agent], 201);
    }

    public function show(Request $request, AiAgent $agent)
    {
        $this->authorize('ai_agent.update');

        if ($this->resolveGroupId($request) && $agent->group_id !== $this->resolveGroupId($request)) {
            return $this->error('Agent not found', [], 404);
        }

        return $this->success(['agent' => $agent]);
    }

    public function update(Request $request, AiAgent $agent)
    {
        $this->authorize('ai_agent.update');

        $data = $this->validate($request, [
            'groupId' => 'sometimes|nullable|integer|exists:groups,id',
            'name' => 'required|string|max:255',
            'image' => 'nullable|string',
            'enabled' => 'sometimes|boolean',
            'personality' => 'nullable|string',
            'greeting_type' => 'nullable|string',
            'initial_flow_id' => 'nullable|integer|exists:ai_agent_flows,id',
            'basic_greeting_message' => 'nullable|string',
            'basic_greeting_flow_ids' => 'nullable|array',
            'transfer_instruction' => 'nullable|string',
            'cant_assist_instruction' => 'nullable|string',
        ]);

        if ($this->resolveGroupId($request) && $agent->group_id !== $this->resolveGroupId($request)) {
            return $this->error('Agent not found', [], 404);
        }

        $agent->update([
            ...$data,
            'group_id' => $request->exists('groupId')
                ? $this->resolveGroupId($request)
                : $agent->group_id,
        ]);

        return $this->success(['agent' => $agent]);
    }

    public function destroy(string $ids)
    {
        $this->authorize('ai_agent.update');

        $this->scopedQuery(request())->whereIn('id', explode(',', $ids))->delete();

        return $this->success([], 204);
    }

    protected function resolveGroupId(Request $request): ?int
    {
        $groupId = $request->input('groupId', $request->query('groupId'));

        return is_numeric($groupId) ? (int) $groupId : null;
    }

    protected function scopedQuery(Request $request)
    {
        $groupId = $this->resolveGroupId($request);

        $query = AiAgent::query();

        if ($groupId) {
            $query->where(function ($query) use ($groupId) {
                $query->whereNull('group_id')->orWhere('group_id', $groupId);
            });
        }

        return $query;
    }
}
