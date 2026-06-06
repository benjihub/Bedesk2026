<?php namespace Livechat\Widget\Controllers;

use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;
use Livechat\Widget\Users\WidgetCustomerResource;

class WidgetCustomerExternalData extends BaseController
{
    public function __invoke()
    {
        $user = auth('chatWidget')->user();

        $data = request()->all();

        if (!empty($data)) {
            $user->updateCustomAttributes($data);
        }

        return $this->success([
            'user' => new WidgetCustomerResource($user),
        ]);
    }
}
