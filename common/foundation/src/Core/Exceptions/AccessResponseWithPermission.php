<?php

namespace Common\Core\Exceptions;

use Illuminate\Auth\Access\Response as LaravelAccessResponse;

class AccessResponseWithPermission extends LaravelAccessResponse
{
    public function __construct(
        protected $allowed,
        public string|null $permission,
        protected $message = '',
        protected $code = null,
    ) {
        parent::__construct($allowed, $message, $code);
    }
}
