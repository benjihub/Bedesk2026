<?php

namespace Envato;

use Common\Auth\Events\SocialConnected;
use Common\Auth\Events\SocialLogin;
use Common\Auth\Events\UserCreated;
use Envato\Purchases\UserEnvatoPurchases;
use Envato\SocialiteProviders\EnvatoProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Contracts\Factory;

class EnvatoServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Routes
        if (!app()->routesAreCached()) {
            Route::prefix('api')
                ->middleware('api')
                ->group(function () {
                    $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
                });

            Route::middleware('web')->group(function () {
                $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
            });
        }

        // update user purchases after login via envato or when connecting envato from account settings page
        Event::listen(function (SocialLogin|SocialConnected $event) {
            if ($event->socialName === 'envato') {
                (new UserEnvatoPurchases($event->user))->sync();
            }
        });

        Event::listen(function (UserCreated $event) {
            if (isset($event->data['envato_purchase_code'])) {
                (new UserEnvatoPurchases($event->user))->addUsingCode(
                    $event->data['envato_purchase_code'],
                );
            }
        });

        $this->registerSocialiteEnvatoDriver();
    }

    private function registerSocialiteEnvatoDriver(): void
    {
        if (settings('envato.enable')) {
            $socialite = $this->app->make(Factory::class);
            $socialite->extend('envato', function ($app) use ($socialite) {
                $config = $app['config']['services.envato'];
                return $socialite->buildProvider(
                    EnvatoProvider::class,
                    $config,
                );
            });
        }
    }
}
