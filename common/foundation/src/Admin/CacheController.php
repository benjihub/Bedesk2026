<?php

namespace Common\Admin;

use Common\Core\BaseController;
use Illuminate\Support\Facades\Artisan;

class CacheController extends BaseController
{
    public function __construct()
    {
        $this->middleware('isAdmin');
    }

    public function flush()
    {
        $this->blockOnDemoSite();

        Artisan::call('optimize:clear');

        return $this->success();
    }
}
