<?php

namespace Common\Auth\Controllers;

use Common\Core\Demo\BlocksFunctionalityOnDemoSite;
use Illuminate\Http\Request;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController as FortifyTwoFactorAuthenticationController;

class TwoFactorAuthenticationController extends
    FortifyTwoFactorAuthenticationController
{
    use BlocksFunctionalityOnDemoSite;

    public function store(
        Request $request,
        EnableTwoFactorAuthentication $enable,
    ) {
        $this->blockOnDemoSite();

        return parent::store($request, $enable);
    }
}
