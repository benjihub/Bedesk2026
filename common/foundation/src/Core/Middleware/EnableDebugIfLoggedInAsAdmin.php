<?php

namespace Common\Core\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnableDebugIfLoggedInAsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if ($this->loggedInAsAdmin($request) && !config('app.demo')) {
            config(['app.debug' => true]);
        }

        return $next($request);
    }

    protected function loggedInAsAdmin(Request $request): bool
    {
        try {
            // prevent this from causing issues with updating to new versions
            return $request->user('sanctum')?->hasPermission('admin');
        } catch (\Throwable $e) {
            return false;
        }
    }
}
