<?php namespace Envato\Http\Controllers;

use App\Models\User;
use Common\Core\BaseController;
use Envato\Purchases\UserEnvatoPurchases;

class UserEnvatoPurchasesController extends BaseController
{
    public function __invoke(User $user)
    {
        $this->authorize('show', $user);

        return $this->success([
            'purchases' => (new UserEnvatoPurchases($user))->get(),
        ]);
    }
}
