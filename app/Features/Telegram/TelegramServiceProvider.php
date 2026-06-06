<?php

namespace App\Features\Telegram;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class TelegramServiceProvider extends ServiceProvider
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
        $bridgeClass = config('telegram.bridge');
        if (!is_string($bridgeClass) || !class_exists($bridgeClass)) {
            $bridgeClass = \App\Features\Telegram\Support\NullTelegramBridge::class;
        }

        $this->app->bind(\App\Features\Telegram\Contracts\TelegramBridgeInterface::class, $bridgeClass);
        $this->app->bind(
            \App\Features\Telegram\Contracts\TelegramClientInterface::class,
            \App\Features\Telegram\Infrastructure\Clients\TelegramApiClient::class,
        );
    }
}
