<?php

namespace App\Core\Middleware;

use Closure;
use Illuminate\Http\Request;

class ConfigureCookies
{
    public function handle(Request $request, Closure $next)
    {
        if (!request()->isSecure()) {
            config()->set('session.secure', false);
            config()->set('session.partitioned', false);
            config()->set('session.same_site', 'lax');
        }

        return $next($request);
    }
}
