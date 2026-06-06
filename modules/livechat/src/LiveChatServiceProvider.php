<?php

namespace Livechat;

use App\Models\User;
use Common\Auth\Middleware\OptionalAuthenticate;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Livechat\Commands\ChatCycleCommand;
use Livechat\Commands\DeleteNeverActiveVisitors;
use Livechat\Commands\MarkOldPageVisitsAsEnded;
use Livechat\Middleware\LivechatOptionalAuthenticate;
use Livechat\Models\Campaign;
use Livechat\Policies\CampaignPolicy;
use Livechat\Widget\Middleware\AuthenticateWidget;
use App\Core\WidgetFlags;

class LiveChatServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // config
        $this->mergeConfigFrom(__DIR__ . '/../config/site.php', 'app');
        $this->replaceConfigRecursivelyFrom(
            __DIR__ . '/../config/auth.php',
            'auth',
        );

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
            Route::group([], function () {
                $this->loadRoutesFrom(__DIR__ . '/../routes/widget.php');
            });
        }

        // Migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Views
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'livechat');

        // Policies
        Gate::policy(Campaign::class, CampaignPolicy::class);

        // Commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                ChatCycleCommand::class,
                MarkOldPageVisitsAsEnded::class,
                DeleteNeverActiveVisitors::class,
            ]);

            $this->app->booted(function () {
                $schedule = $this->app->make(Schedule::class);
                $schedule
                    ->command(MarkOldPageVisitsAsEnded::class)
                    ->everyFiveMinutes();
                $schedule
                    ->command(ChatCycleCommand::class)
                    ->name('livechat:chat-cycle')
                    ->everyMinute()
                    ->withoutOverlapping(1);
                $schedule
                    ->command(DeleteNeverActiveVisitors::class)
                    ->name('livechat:delete-never-active-visitors')
                    ->weekly()
                    ->at('01:00');
            });
        }

        // chat widget authentication
        Auth::viaRequest('chatWidget', function () {
            if (
                $userId = session()->get(AuthenticateWidget::widgetCustomerKey)
            ) {
                return User::find($userId);
            }
            return null;
        });
    }

    public function register()
    {
        // disable laravel default session authentication if request is from widget
        if (WidgetFlags::isLivechatWidget()) {
            config()->set('sanctum.middleware.authenticate_session', null);

            $this->app->bind(
                OptionalAuthenticate::class,
                LivechatOptionalAuthenticate::class,
            );
        }
    }
}
