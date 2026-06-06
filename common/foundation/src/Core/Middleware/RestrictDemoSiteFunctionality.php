<?php namespace Common\Core\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RestrictDemoSiteFunctionality
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::user() && Auth::user()->email === config('app.demo_email')) {
            return $next($request);
        }

        $uri = str_replace(
            ['secure/', 'api/v1/'],
            '',
            $request->route()->uri(),
        );

        if ($this->shouldForbidRequest($request, $uri)) {
            abort(403, "You can't do that on demo site.");
        }

        return $next($request);
    }

    /**
     * Check if specified request should be forbidden on demo site.
     */
    private function shouldForbidRequest(Request $request, string $uri): bool
    {
        $method = $request->method();

        $blockedRoutes = config('demo-blocked-routes') ?? [];

        foreach ($blockedRoutes as $route) {
            if (
                $method === $route['method'] &&
                trim($uri) === trim($route['name'])
            ) {
                $originMatches = true;
                $paramsMatch = true;

                //block this request only if it originated from specified origin, for example: admin area
                if (isset($route['origin'])) {
                    $originMatches = Str::contains(
                        $request->server('HTTP_REFERER'),
                        $route['origin'],
                    );
                }

                if (isset($route['params'])) {
                    $paramsMatch =
                        collect($route['params'])->first(function (
                            $param,
                            $key,
                        ) use ($request) {
                            $routeParam = $request->route($key);
                            if (is_array($param)) {
                                return in_array($routeParam, $param);
                            } else {
                                return $routeParam == $param;
                            }
                        }) !== null;
                }

                return $originMatches && $paramsMatch;
            }
        }

        return false;
    }
}
