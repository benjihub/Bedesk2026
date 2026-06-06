<?php

namespace App\Features\Whatsapp;

use App\Features\Whatsapp\Commands\SendTestWhatsappMessage;
use App\Features\Whatsapp\Contracts\WhatsappBridgeInterface;
use App\Features\Whatsapp\Contracts\WhatsappClientInterface;
use App\Features\Whatsapp\Infrastructure\Clients\MetaWhatsappClient;
use App\Features\Whatsapp\Support\NullWhatsappBridge;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class WhatsappServiceProvider extends ServiceProvider
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

        if ($this->app->runningInConsole()) {
            $this->commands([SendTestWhatsappMessage::class]);
        }
    }

    public function register(): void
    {
        $bridgeClass = config('whatsapp.bridge');
        if (!is_string($bridgeClass) || !class_exists($bridgeClass)) {
            $bridgeClass = NullWhatsappBridge::class;
        }

        $this->app->bind(WhatsappBridgeInterface::class, $bridgeClass);
        $this->app->bind(
            WhatsappClientInterface::class,
            MetaWhatsappClient::class,
        );
    }
}
