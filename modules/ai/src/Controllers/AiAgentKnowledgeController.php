<?php

namespace Ai\Controllers;

use Common\Core\BaseController;

class AiAgentKnowledgeController extends BaseController
{
    public function index()
    {
        $this->authorize('ai_agent.update');

        return $this->success([
            'ingesting' => false,
            'websites' => [
                'items' => [],
                'ingesting' => false,
                'more' => [
                    'count' => 0,
                    'ingesting' => false,
                ],
            ],
            'documents' => [
                'items' => [],
                'ingesting' => false,
                'more' => [
                    'count' => 0,
                    'ingesting' => false,
                ],
            ],
            'articles' => [
                'items' => [],
                'ingesting' => false,
                'more' => [
                    'count' => 0,
                    'ingesting' => false,
                ],
            ],
            'snippets' => [
                'items' => [],
                'ingesting' => false,
                'more' => [
                    'count' => 0,
                    'ingesting' => false,
                ],
            ],
        ]);
    }
}
