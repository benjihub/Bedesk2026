<?php namespace App\Team\Controllers;

use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;
use App\Team\LoadAllCompactAgents;

class CompactAgentsController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function __invoke()
    {
        Auth::user()->touchLastActiveAt();

        return $this->success([
            'agents' => (new LoadAllCompactAgents())->execute(),
        ]);
    }
}
