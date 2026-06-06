<?php

namespace Common\Core\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Sentry\State\Scope;
use function Sentry\configureScope;

class SetSentryUserMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($user = $request->user('sanctum')) {
            configureScope(function (Scope $scope) use ($user) {
                $scope->setUser(['email' => $user->email, 'id' => $user->id]);
            });
        }

        return $next($request);
    }
}
