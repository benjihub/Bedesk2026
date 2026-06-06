<?php

namespace Common\Core\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class RedirectIfAuthenticated
{
    public function handle($request, Closure $next, string ...$guards)
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                return response()->json(
                    ['status' => 'error', 'message' => 'already logged in'],
                    403,
                );
            }
        }

        return $next($request);
    }
}
