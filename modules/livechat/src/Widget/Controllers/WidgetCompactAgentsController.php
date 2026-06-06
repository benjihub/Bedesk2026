<?php

namespace Livechat\Widget\Controllers;

use App\Team\LoadAllCompactAgents;
use Common\Core\BaseController;

class WidgetCompactAgentsController extends BaseController
{
    public function __invoke()
    {
        return $this->success([
            'agents' => (new LoadAllCompactAgents())->execute(),
        ]);
    }
}
