<?php

namespace Livechat\Widget\Controllers;

use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;
use Livechat\Widget\Users\WidgetCustomerResource;

class WidgetCustomerController extends BaseController
{
    public function show()
    {
        $customer = auth('chatWidget')->user()->load('latestUserSession');

        return $this->success([
            'user' => new WidgetCustomerResource($customer),
        ]);
    }
}
