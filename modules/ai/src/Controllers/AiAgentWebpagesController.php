<?php

namespace Ai\Controllers;

use Common\Core\BaseController;
use Illuminate\Http\Request;

class AiAgentWebpagesController extends BaseController
{
    public function index(int $websiteId, Request $request)
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

    public function show(int $websiteId, int $webpageId)
    {
        $this->authorize('ai_agent.update');

        return $this->error('Webpage not found', [], 404);
    }

    public function destroy(int $websiteId, string $ids)
    {
        $this->authorize('ai_agent.update');

        return $this->success([], 204);
    }
}
