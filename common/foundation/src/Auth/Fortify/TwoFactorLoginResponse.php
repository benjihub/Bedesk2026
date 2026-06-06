<?php

namespace Common\Auth\Fortify;

use Common\Auth\Fortify\LoginResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

class TwoFactorLoginResponse extends LoginResponse implements
    TwoFactorLoginResponseContract
{
}
