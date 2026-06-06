<?php

namespace Ai;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AiServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (!app()->routesAreCached()) {
            Route::prefix('api')
                ->middleware('api')
                ->group(function () {
                    $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
                });
        }
    }

    public function register(): void
    {
        // currently no bindings required for AI module
    }
}
