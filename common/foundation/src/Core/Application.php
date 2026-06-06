<?php

namespace Common\Core;

use App\Providers\AppServiceProvider;
use Common\Auth\Fortify\AppFortifyServiceProvider;
use Common\CommonServiceProvider;
use Common\Core\Middleware\TrustHosts;
use Common\Core\Middleware\TrustProxies;
use Illuminate\Foundation\Application as LaravelApplication;
use Illuminate\Foundation\Configuration\Middleware;

class Application
{
    public static function create(
        string $basePath,
        array $providers = [],
        array $middleware = [],
    ): LaravelApplication {
        return LaravelApplication::configure(basePath: $basePath)
            ->withRouting(
                web: $basePath . '/routes/web.php',
                api: $basePath . '/routes/api.php',
                commands: $basePath . '/routes/console.php',
                channels: $basePath . '/routes/channels.php',
                health: '/up',
            )
            ->withMiddleware(function (Middleware $middlewareConfig) use (
                $middleware,
            ) {
                $middlewareConfig->append([
                    TrustHosts::class,
                    TrustProxies::class,
                    ...$middleware,
                ]);
            })
            ->withExceptions()
            ->withProviders(
                [
                    AppFortifyServiceProvider::class,
                    CommonServiceProvider::class,
                    AppServiceProvider::class,
                    ...$providers,
                ],
                withBootstrapProviders: false,
            )
            ->create();
    }
}
