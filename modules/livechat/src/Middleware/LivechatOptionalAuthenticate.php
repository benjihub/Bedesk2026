<?php

namespace Livechat\Middleware;

use Closure;
use Common\Auth\Middleware\OptionalAuthenticate;
use Livechat\Widget\Middleware\AuthenticateWidget;

class LivechatOptionalAuthenticate extends OptionalAuthenticate
{
    public function handle($request, Closure $next, ...$guards)
    {
        settings()->set('require_email_confirmation', false);
        return app(AuthenticateWidget::class)->handle(
            $request,
            $next,
            ...$guards,
        );
    }
}
