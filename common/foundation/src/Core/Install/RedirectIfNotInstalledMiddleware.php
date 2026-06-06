<?php

namespace Common\Core\Install;

use Closure;
use Common\Settings\DotEnvEditor;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RedirectIfNotInstalledMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!file_exists(base_path('.env'))) {
            $isInstalled = false;
        } else {
            // load from env directly to avoid cache issues
            $envValues = (new DotEnvEditor())->load();
            $isInstalled = $envValues['installed'] ?? false;
        }

        if (!$isInstalled && !Str::contains($request->path(), 'install')) {
            return redirect()->route('install');
        }

        return $next($request);
    }
}
