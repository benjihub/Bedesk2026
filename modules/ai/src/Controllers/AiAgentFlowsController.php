<?php

namespace Ai\Controllers;

use Ai\AiAgent\Models\AiAgentFlow;
use Common\Core\BaseController;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AiAgentFlowsController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('ai_agent.update');

        $perPage = $request->get('perPage', 15);
        $flows = $this->scopedQuery($request)
            ->orderByRaw('CASE WHEN group_id IS NULL THEN 1 ELSE 0 END')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return $this->success([
            'pagination' => $flows,
        ]);
    }

    public function show(int $id)
    {
        $this->authorize('ai_agent.update');

        $flow = $this->scopedQuery(request())->find($id);

        if (!$flow) {
            return $this->error('Flow not found', [], 404);
        }

        return $this->success(['flow' => $flow]);
    }

    public function store(Request $request)
    {
        $this->authorize('ai_agent.update');

        $data = $this->validate($request, [
            'groupId' => 'sometimes|nullable|integer|exists:groups,id',
            'name' => 'required|string|min:2|max:255',
            'description' => 'nullable|string',
            'config' => 'nullable|array',
        ]);

        $config = $data['config'] ?? ['nodes' => []];
        $groupId = $this->resolveGroupId($request);

        $flow = AiAgentFlow::create([
            'group_id' => $groupId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'config' => $config,
        ]);

        return $this->success(['flow' => $flow]);
    }

    public function update(int $id, Request $request)
    {
        $this->authorize('ai_agent.update');

        $data = $this->validate($request, [
            'groupId' => 'sometimes|nullable|integer|exists:groups,id',
            'name' => 'required|string|min:2|max:255',
            'description' => 'nullable|string',
            'config' => 'nullable|array',
        ]);

        $flow = $this->scopedQuery($request)->findOrFail($id);

        $config = $data['config'] ?? $flow->config ?? ['nodes' => []];
        $groupId = $this->resolveGroupId($request) ?? $flow->group_id;

        $flow->update([
            'group_id' => $groupId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'config' => $config,
        ]);

        return $this->success(['flow' => $flow]);
    }

    public function destroy(string $ids)
    {
        $this->authorize('ai_agent.update');

        $this->scopedQuery(request())->whereIn('id', explode(',', $ids))->delete();

        return $this->success([], 204);
    }

    /**
     * Get list of flows for dropdown/selection purposes
     */
    public function list(Request $request)
    {
        $this->authorize('ai_agent.update');

        $flows = $this->scopedQuery($request)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return $this->success([
            'flows' => $flows,
        ]);
    }

    /**
     * Get flow attachments
     */
    public function attachments(int $flowId)
    {
        $this->authorize('ai_agent.update');

        $flow = $this->scopedQuery(request())->find($flowId);
        if (!$flow) {
            return $this->error('Flow not found', [], 404);
        }

        return $this->success([
            'attachments' => [],
        ]);
    }

    protected function resolveGroupId(Request $request): ?int
    {
        $groupId = $request->input('groupId', $request->query('groupId'));

        return is_numeric($groupId) ? (int) $groupId : null;
    }

    protected function scopedQuery(Request $request)
    {
        $groupId = $this->resolveGroupId($request);

        return AiAgentFlow::query()->where(function ($query) use ($groupId) {
            if ($groupId) {
                $query->whereNull('group_id')->orWhere('group_id', $groupId);
                return;
            }

            $query->whereNull('group_id');
        });
    }
}
