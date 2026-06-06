<?php

namespace Common\Auth\Controllers;

use Common\Core\BaseController;
use Common\Core\Values\PermissionConfig;
use Common\Settings\Models\Setting;

class PermissionsController extends BaseController
{
    public function index()
    {
        $this->authorize('index', Setting::class);

        return $this->success([
            'permissions' => (new PermissionConfig())->getWithId(),
        ]);
    }
}
