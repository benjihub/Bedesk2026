<?php

namespace Common\Core\Middleware;

use Illuminate\Support\Facades\Auth;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            throw new AuthenticationException();
        }

        if (!Auth::user()->hasPermission('admin')) {
            throw new AuthorizationException();
        }

        return $next($request);
    }
}
