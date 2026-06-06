<?php

namespace Common\Auth\Controllers;

use Common\Core\Demo\BlocksFunctionalityOnDemoSite;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\UpdatesUserPasswords;
use Laravel\Fortify\Http\Controllers\PasswordController as FortifyPasswordController;

class PasswordController extends FortifyPasswordController
{
    use BlocksFunctionalityOnDemoSite;

    public function update(Request $request, UpdatesUserPasswords $updater)
    {
        $this->blockOnDemoSite();

        return parent::update($request, $updater);
    }
}
