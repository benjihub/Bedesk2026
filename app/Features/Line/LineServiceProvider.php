<?php

namespace App\Features\Line;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class LineServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (!app()->routesAreCached()) {
            Route::prefix('api')
                ->middleware('api')
                ->group(function () {
                    $this->loadRoutesFrom(__DIR__ . '/routes/api.php');
                });
        }
        $this->loadMigrationsFrom(__DIR__ . '/database/migrations');
    }

    public function register(): void
    {
        $bridgeClass = config('line.bridge');
        if (!is_string($bridgeClass) || !class_exists($bridgeClass)) {
            $bridgeClass = \App\Features\Line\Support\NullLineBridge::class;
        }

        $this->app->bind(\App\Features\Line\Contracts\LineBridgeInterface::class, $bridgeClass);
        $this->app->bind(
            \App\Features\Line\Contracts\LineClientInterface::class,
            \App\Features\Line\Infrastructure\Clients\LineApiClient::class,
        );
    }
}
