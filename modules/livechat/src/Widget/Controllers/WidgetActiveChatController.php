<?php

namespace Livechat\Widget\Controllers;

use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;
use Livechat\Widget\WidgetConversationLoader;

class WidgetActiveChatController extends BaseController
{
    public function __invoke()
    {
        $data = (new WidgetConversationLoader())->activeConversationFor(
            auth('chatWidget')->user(),
        );

        return $this->success($data);
    }
}
