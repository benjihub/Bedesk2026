<?php

namespace Ai\Controllers;

use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Illuminate\Http\Request;

class AiAgentSnippetsController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('ai_agent.update');

        // Return empty paginated response
        return $this->success([
            'pagination' => [
                'data' => [],
                'current_page' => 1,
                'per_page' => 15,
                'total' => 0,
                'from' => null,
                'to' => null,
            ],
        ]);
    }

    public function show(int $id)
    {
        $this->authorize('ai_agent.update');

        return $this->error('Snippet not found', [], 404);
    }

    public function store(Request $request)
    {
        $this->authorize('ai_agent.update');

        return $this->error('Not implemented', [], 501);
    }

    public function update(int $id, Request $request)
    {
        $this->authorize('ai_agent.update');

        return $this->error('Not implemented', [], 501);
    }

    public function destroy(string $ids)
    {
        $this->authorize('ai_agent.update');

        return $this->success([], 204);
    }
}
