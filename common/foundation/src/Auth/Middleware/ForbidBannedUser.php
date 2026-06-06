<?php

namespace Common\Auth\Middleware;

use Closure;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;

class ForbidBannedUser
{
    public function handle(Request $request, Closure $next)
    {
        if (
            $request->user('sanctum')?->isBanned() &&
            $request->path() !== '/' &&
            $request->path() !== 'auth/logout'
        ) {
            abort(403);
        }

        return $next($request);
    }
}
