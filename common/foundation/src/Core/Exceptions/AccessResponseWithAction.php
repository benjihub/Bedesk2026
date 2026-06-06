<?php

namespace Common\Core\Exceptions;

use Common\Core\Exceptions\AccessResponseWithPermission;

class AccessResponseWithAction extends AccessResponseWithPermission
{
    public array|null $action;
}
