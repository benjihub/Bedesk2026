<?php

namespace Common;

use App\Models\Channel;
use App\Models\User;
use App\Policies\ChannelPolicy;
use Clockwork\Support\Laravel\ClockworkServiceProvider;
use Common\Auth\BaseUser;
use Common\Auth\Commands\DeleteExpiredBansCommand;
use Common\Auth\Commands\DeleteExpiredOtpCodesCommand;
use Common\Auth\Controllers\PasswordController;
use Common\Auth\Controllers\TwoFactorAuthenticationController;
use Common\Auth\Events\UsersDeleted;
use Common\Auth\Middleware\ForbidBannedUser;
use Common\Auth\Middleware\OptionalAuthenticate;
use Common\Auth\Middleware\VerifyApiAccessMiddleware;
use Common\Auth\Permissions\Permission;
use Common\Auth\Permissions\Policies\PermissionPolicy;
use Common\Auth\Roles\Role;
use Common\Billing\Invoices\Invoice;
use Common\Billing\Invoices\InvoicePolicy;
use Common\Billing\Listeners\SyncPlansWhenBillingSettingsChange;
use Common\Billing\Models\Product;
use Common\Billing\Subscription;
use Common\Comments\Comment;
use Common\Comments\CommentPolicy;
use Common\Core\AppUrl;
use Common\Core\Bootstrap\BaseBootstrapData;
use Common\Core\Bootstrap\BootstrapData;
use Common\Core\Commands\GenerateChecksums;
use Common\Core\Commands\GenerateSitemap;
use Common\Core\Commands\SeedCommand;
use Common\Core\Commands\UpdateSimplePaginateTables;
use Common\Core\Contracts\AppUrlGenerator;
use Common\Core\Exceptions\BaseExceptionHandler;
use Common\Core\Install\RedirectIfNotInstalledMiddleware;
use Common\Core\Middleware\EnableDebugIfLoggedInAsAdmin;
use Common\Core\Middleware\EnsureEmailIsVerified;
use Common\Core\Middleware\EnsureFrontendRequestsAreStateful;
use Common\Core\Middleware\IsAdmin;
use Common\Core\Middleware\PrerenderIfCrawler;
use Common\Core\Middleware\RedirectIfAuthenticated;
use Common\Core\Middleware\RestrictDemoSiteFunctionality;
use Common\Core\Middleware\SetAppLocale;
use Common\Core\Middleware\SetSentryUserMiddleware;
use Common\Core\Middleware\SimulateSlowConnectionMiddleware;
use Common\Core\Middleware\VerifyCsrfToken;
use Common\Core\Policies\FileEntryPolicy;
use Common\Core\Policies\LocalizationPolicy;
use Common\Core\Policies\PagePolicy;
use Common\Core\Policies\ProductPolicy;
use Common\Core\Policies\ReportPolicy;
use Common\Core\Policies\RolePolicy;
use Common\Core\Policies\SettingPolicy;
use Common\Core\Policies\SubscriptionPolicy;
use Common\Core\Policies\TagPolicy;
use Common\Core\Policies\UserPolicy;
use Common\Core\Prerender\BaseUrlGenerator;
use Common\Core\Rendering\CrawlerDetector;
use Common\Csv\DeleteExpiredCsvExports;
use Common\Database\CustomLengthAwarePaginator;
use Common\Database\CustomSimplePaginator;
use Common\Domains\CustomDomain;
use Common\Domains\CustomDomainPolicy;
use Common\Domains\CustomDomainsEnabled;
use Common\Files\Actions\Deletion\DeleteEntries;
use Common\Files\Commands\DeleteUploadArtifacts;
use Common\Files\Events\FileUploaded;
use Common\Files\FileEntry;
use Common\Files\Listeners\CreateThumbnailForUploadedFile;
use Common\Files\Providers\RegisterCustomFlysystemProviders;
use Common\Files\S3\AbortOldS3Uploads;
use Common\Files\Tus\DeleteExpiredTusUploads;
use Common\Files\Tus\TusServiceProvider;
use Common\Files\Uploads\CountUploadingBackendFiles;
use Common\Localizations\Commands\ExportTranslations;
use Common\Localizations\Commands\GenerateFooTranslations;
use Common\Localizations\Listeners\UpdateAllUsersLanguageWhenDefaultLocaleChanges;
use Common\Localizations\Localization;
use Common\Logging\CleanLogTables;
use Common\Logging\Mail\OutgoingEmailLogSubscriber;
use Common\Logging\Schedule\MonitorsSchedule;
use Common\Logging\Schedule\ScheduleHealthCommand;
use Common\Pages\CustomPage;
use Common\Search\Commands\ImportRecordsIntoScoutCommand;
use Common\Search\Drivers\Mysql\MysqlSearchEngine;
use Common\ServerTiming\ServerTiming;
use Common\ServerTiming\ServerTimingMiddleware;
use Common\Settings\Events\SettingsSaved;
use Common\Settings\Mail\GmailApiMailTransport;
use Common\Settings\Mail\GmailClient;
use Common\Settings\Models\Setting;
use Common\Settings\Settings;
use Common\Settings\Themes\CssTheme;
use Common\Settings\Themes\CssThemePolicy;
use Common\Tags\Tag;
use Common\Workspaces\Actions\RemoveMemberFromWorkspace;
use Common\Workspaces\ActiveWorkspace;
use Common\Workspaces\Policies\WorkspaceMemberPolicy;
use Common\Workspaces\Policies\WorkspacePolicy;
use Common\Workspaces\Workspace;
use Common\Workspaces\WorkspaceMember;
use Illuminate\Console\Events\ArtisanStarting;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Contracts\Foundation\CachesConfiguration;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\AliasLoader;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as LaravelValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Http\Controllers\PasswordController as FortifyPasswordController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController as FortifyTwoFactorAuthenticationController;
use Laravel\Horizon\Horizon;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as SanctumEnsureFrontendRequestsAreStateful;
use Laravel\Scout\EngineManager;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\SocialiteServiceProvider;
use Matchish\ScoutElasticSearch\ElasticSearchServiceProvider;
use Matchish\ScoutElasticSearch\Engines\ElasticSearchEngine;
use Symfony\Component\Stopwatch\Stopwatch;

require_once 'helpers.php';

class CommonServiceProvider extends ServiceProvider
{
    use MonitorsSchedule;

    public function __construct($app)
    {
        parent::__construct($app);
        $app->instance('path.common', base_path('common/foundation'));
    }

    public function boot(): void
    {
        Model::preventLazyLoading(!$this->app->isProduction());

        Route::prefix('api')
            ->middleware('api')
            ->group(function () {
                $this->loadRoutesFrom(app('path.common') . '/routes/api.php');
            });
        Route::middleware('web')->group(function () {
            $this->loadRoutesFrom(app('path.common') . '/routes/web.php');
        });
        $this->loadRoutesFrom(app('path.common') . '/routes/webhooks.php');

        $this->loadMigrationsFrom(app('path.common') . '/database/migrations');
        $this->loadViewsFrom(app('path.common') . '/resources/views', 'common');
        $this->loadViewsFrom(
            storage_path('app/editable-views'),
            'editable-views',
        );

        $this->registerGatePoliciesAndAbilities();
        $this->registerRouteBindings();
        $this->registerCustomValidationRules();
        $this->registerCommands();
        $this->registerMiddleware();
        $this->registerCollectionExtensions();
        $this->registerEventListeners();
        $this->registerCustomMailDrivers();
        $this->setMorphMap();

        Vite::useScriptTagAttributes([
            'data-keep' => 'true',
        ]);
        Vite::useStyleTagAttributes([
            'data-keep' => 'true',
        ]);
        Vite::usePreloadTagAttributes([
            'data-keep' => 'true',
        ]);

        // install/update page components
        Blade::component(
            'common::install.components.install-layout',
            'install-layout',
        );
        Blade::component(
            'common::install.components.install-button',
            'install-button',
        );
    }

    public function register()
    {
        $this->registerCoreBindings();

        $this->loadConfig();

        $request = $this->app->make(Request::class);
        $this->app->instance(AppUrl::class, (new AppUrl())->init());
        $this->normalizeRequestUri($request);
        app('url')->forceRootUrl(config('app.url'));

        $loader = AliasLoader::getInstance();

        // register socialite service provider and alias
        $this->app->register(SocialiteServiceProvider::class);
        $loader->alias('Socialite', Socialite::class);

        $this->app->register(TusServiceProvider::class);

        // server timing
        $this->app->singleton(ServerTiming::class, function ($app) {
            return new ServerTiming(new Stopwatch());
        });
        $this->app->singleton(
            CrawlerDetector::class,
            fn($app) => new CrawlerDetector(),
        );

        // active workspace
        if (config('app.workspaces_integrated')) {
            $this->app->singleton(ActiveWorkspace::class, function () {
                return new ActiveWorkspace();
            });
        }

        // need the same instance of settings for request lifecycle, so dynamically changed settings work correctly
        $this->app->singleton(Settings::class, fn() => new Settings());

        $this->app->singleton(
            'guestRole',
            fn() => Role::where('guests', true)->first(),
        );

        // url generator for SEO
        $this->app->bind(AppUrlGenerator::class, BaseUrlGenerator::class);

        // bootstrap data
        $this->app->bind(BootstrapData::class, BaseBootstrapData::class);

        // pagination
        $this->app->bind(
            LengthAwarePaginator::class,
            CustomLengthAwarePaginator::class,
        );

        $this->app->bind(
            FortifyPasswordController::class,
            PasswordController::class,
        );
        $this->app->bind(
            FortifyTwoFactorAuthenticationController::class,
            TwoFactorAuthenticationController::class,
        );
        $this->app->bind(Paginator::class, CustomSimplePaginator::class);

        $this->registerDevProviders();

        (new RegisterCustomFlysystemProviders())->execute();

        // register scout drivers
        resolve(EngineManager::class)->extend('mysql', function () {
            return new MysqlSearchEngine();
        });
        if (config('scout.driver') === ElasticSearchEngine::class) {
            $this->app->register(ElasticSearchServiceProvider::class);
        }
    }

    private function registerCoreBindings(): void
    {
        $bindings = [
            ExceptionHandler::class => BaseExceptionHandler::class,
            SanctumEnsureFrontendRequestsAreStateful::class =>
                EnsureFrontendRequestsAreStateful::class,
            LaravelValidateCsrfToken::class => VerifyCsrfToken::class,
        ];

        foreach ($bindings as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }
    }

    private function loadConfig(): void
    {
        $merge = [
            // laravel
            'app',
            'services',

            // common
            'setting-validators',
            'menus',
            'seo/common',
        ];
        foreach ($merge as $config) {
            $this->mergeConfigFrom(
                app('path.common') . "/config/{$config}.php",
                str_replace('/', '.', $config),
            );
        }

        $mergeRecursive = [
            'mail',
            'database',
            'scout',
            'logging',
            'broadcasting',
        ];

        foreach ($mergeRecursive as $config) {
            $this->replaceConfigRecursivelyFrom(
                app('path.common') . "/config/{$config}.php",
                str_replace('/', '.', $config),
            );
        }

        if (
            !(
                $this->app instanceof CachesConfiguration &&
                $this->app->configurationIsCached()
            )
        ) {
            $config = $this->app->make('config');
            $config->set(
                'filesystems',
                array_replace_recursive(
                    require app('path.common') . '/config/filesystems.php',
                    Arr::except($config->get('filesystems', []), ['disks']),
                ),
            );
        }

        // these 3rd party package configs are loaded before CommonServiceProvider, so we need to override some
        // config keys, instead of merging. This will prevent overriding this config via app config though
        $override = [
            'fortify',
            'log-viewer',
            'geoip',
            'sentry',
            'sanctum',
            // "default" for cache will not get overridden, otherwise
            'cache',
        ];
        foreach ($override as $config) {
            $this->forceOverrideConfigFrom(
                app('path.common') . "/config/{$config}.php",
                str_replace('/', '.', $config),
            );
        }
    }

    // this will override any config provided by app or other packages
    protected function forceOverrideConfigFrom($path, $key)
    {
        if (
            !(
                $this->app instanceof CachesConfiguration &&
                $this->app->configurationIsCached()
            )
        ) {
            $config = $this->app->make('config');
            $config->set(
                $key,
                array_merge($config->get($key, []), require $path),
            );
        }
    }

    /**
     * Remove sub-directory from request uri, so as far as laravel/symfony
     * is concerned request came from public directory, even if request
     * was redirected from root laravel folder to public via .htaccess
     *
     * This will solve issues where requests redirected from laravel root
     * folder to public via .htaccess (or other) redirects are not working
     * if laravel is inside a subdirectory. Mostly useful for shared hosting
     * or local dev where virtual hosts can't be set up properly.
     *
     * @param Request $request
     */
    private function normalizeRequestUri(Request $request): void
    {
        $parsedUrl = parse_url(config('app.url'));

        //if there's no subdirectory we can bail
        if (!isset($parsedUrl['path'])) {
            return;
        }

        $originalUri = $request->server->get('REQUEST_URI');
        $subdirectory = preg_quote($parsedUrl['path'], '/');
        $normalizedUri = preg_replace("/^$subdirectory/", '', $originalUri);

        //if uri starts with "/public" after normalizing,
        //we can bail as laravel will handle this uri properly
        if (str_starts_with(ltrim($normalizedUri, '/'), 'public')) {
            return;
        }

        $request->server->set('REQUEST_URI', $normalizedUri);
    }

    private function registerMiddleware(): void
    {
        if (!config('app.installed')) {
            $this->app['router']->pushMiddlewareToGroup(
                'web',
                RedirectIfNotInstalledMiddleware::class,
            );
            return;
        }

        $aliasMiddleware = [
            'isAdmin' => IsAdmin::class,
            'verified' => EnsureEmailIsVerified::class,
            'optionalAuth' => OptionalAuthenticate::class,
            'customDomainsEnabled' => CustomDomainsEnabled::class,
            'prerenderIfCrawler' => PrerenderIfCrawler::class,
            'verifyApiAccess' => VerifyApiAccessMiddleware::class,
            'guest' => RedirectIfAuthenticated::class,
        ];

        $apiMiddleware = [
            EnableDebugIfLoggedInAsAdmin::class,
            SimulateSlowConnectionMiddleware::class,
            SetAppLocale::class,
            ForbidBannedUser::class,
            SetSentryUserMiddleware::class,
            VerifyApiAccessMiddleware::class,
            EnsureFrontendRequestsAreStateful::class,
        ];

        $webMiddleware = [
            EnableDebugIfLoggedInAsAdmin::class,
            SimulateSlowConnectionMiddleware::class,
            ServerTimingMiddleware::class,
            SetAppLocale::class,
            ForbidBannedUser::class,
            SetSentryUserMiddleware::class,
        ];

        if (config('sanctum.middleware.authenticate_session')) {
            $webMiddleware[] = config(
                'sanctum.middleware.authenticate_session',
            );
        }

        if (config('app.demo')) {
            $apiMiddleware[] = RestrictDemoSiteFunctionality::class;
            $webMiddleware[] = RestrictDemoSiteFunctionality::class;
        }

        foreach ($apiMiddleware as $middleware) {
            $this->app['router']->pushMiddlewareToGroup('api', $middleware);
        }

        foreach ($webMiddleware as $middleware) {
            $this->app['router']->pushMiddlewareToGroup('web', $middleware);
        }

        foreach ($aliasMiddleware as $alias => $middleware) {
            $this->app['router']->aliasMiddleware($alias, $middleware);
        }
    }

    private function registerCustomValidationRules(): void
    {
        Validator::extend(
            'email_verified',
            'Common\Auth\Validators\EmailVerifiedValidator@validate',
        );
        Validator::extend(
            'multi_date_format',
            'Common\Validation\Validators\MultiDateFormatValidator@validate',
        );
    }

    private function registerGatePoliciesAndAbilities(): void
    {
        Gate::policy(FileEntry::class, FileEntryPolicy::class);
        Gate::policy(BaseUser::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(CustomPage::class, PagePolicy::class);
        Gate::policy(Setting::class, SettingPolicy::class);
        Gate::policy(Localization::class, LocalizationPolicy::class);
        Gate::policy('ReportPolicy', ReportPolicy::class);
        Gate::policy(CssTheme::class, CssThemePolicy::class);
        Gate::policy(CustomDomain::class, CustomDomainPolicy::class);
        Gate::policy(Permission::class, PermissionPolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        if (class_exists(Channel::class)) {
            Gate::policy(Channel::class, ChannelPolicy::class);
        }

        // billing
        Gate::policy(Subscription::class, SubscriptionPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);

        // workspaces
        Gate::policy(Workspace::class, WorkspacePolicy::class);
        Gate::policy(WorkspaceMember::class, WorkspaceMemberPolicy::class);

        Gate::define('admin.access', function (BaseUser $user) {
            return $user->hasPermission('admin.access');
        });

        Gate::define('ai_agent.update', function (BaseUser $user) {
            return $user->hasPermission('ai_agent.update');
        });

        Gate::define('ai_agent.settings.update', function (BaseUser $user) {
            return $user->hasPermission('ai_agent.settings.update');
        });

        Gate::define('livechat.update', function (BaseUser $user) {
            return $user->hasPermission('livechat.update');
        });

        Gate::define('viewPulse', function (User $user) {
            return $user->hasPermission('admin.access');
        });

        Horizon::auth(function ($request) {
            if (config('app.demo')) {
                return $request->user()?->email === config('app.demo_email');
            } else {
                return $request->user()?->hasPermission('admin');
            }
        });
    }

    private function registerRouteBindings(): void
    {
        Route::bind('user', function ($value) {
            $id = $value === 'me' ? Auth::id() : (int) $value;

            if (!$id) {
                abort(404);
            }

            return User::query()->findOrFail($id);
        });

        Route::bind('fileEntry', function ($value) {
            $query = FileEntry::query();
            if (\Illuminate\Support\Facades\Schema::hasColumn('file_entries', 'uuid')) {
                $query->where('uuid', $value)->orWhere('id', $value);
            } else {
                $query->where('id', $value);
            }
            return $query->firstOrFail();
        });

        Route::bind('customPage', function ($value) {
            return CustomPage::query()->findOrFail($value);
        });

        Route::bind('workspace', function ($value) {
            return Workspace::query()->findOrFail($value);
        });

        Route::bind('customDomain', function ($value) {
            return CustomDomain::query()->findOrFail($value);
        });
    }

    private function registerCommands(): void
    {
        // register commands
        $commands = [
            DeleteUploadArtifacts::class,
            SeedCommand::class,
            DeleteExpiredCsvExports::class,
            GenerateChecksums::class,
            AbortOldS3Uploads::class,
            DeleteExpiredTusUploads::class,
            UpdateSimplePaginateTables::class,
            DeleteExpiredBansCommand::class,
            DeleteExpiredOtpCodesCommand::class,
            GenerateSitemap::class,
            ScheduleHealthCommand::class,
            CleanLogTables::class,
            ImportRecordsIntoScoutCommand::class,
            CountUploadingBackendFiles::class,
        ];

        if ($this->app->environment() !== 'production') {
            $commands = array_merge($commands, [
                ExportTranslations::class,
                GenerateFooTranslations::class,
            ]);
        }

        $this->commands($commands);

        // schedule commands
        $this->app->booted(function () {
            if (!$this->app->runningInConsole()) {
                return;
            }

            $schedule = $this->app->make(Schedule::class);

            // make sure daily commands are not running at the same time to prevent CPU/Memory spikes
            //$schedule->command(DeleteUploadArtifacts::class)->dailyAt('02:00');
            $schedule
                ->command(DeleteExpiredCsvExports::class)
                ->dailyAt('02:10');
            $schedule->command(AbortOldS3Uploads::class)->dailyAt('02:20');
            $schedule
                ->command(DeleteExpiredTusUploads::class)
                ->dailyAt('02:30');
            $schedule
                ->command(UpdateSimplePaginateTables::class)
                ->dailyAt('02:40');
            $schedule
                ->command(DeleteExpiredBansCommand::class)
                ->dailyAt('02:50');
            $schedule
                ->command(DeleteExpiredOtpCodesCommand::class)
                ->dailyAt('03:00');
            $schedule->command(CleanLogTables::class)->dailyAt('03:10');
            $schedule->command(ScheduleHealthCommand::class)->everyMinute();
            $schedule
                ->command(CountUploadingBackendFiles::class)
                ->everyFifteenMinutes();

            // wait until artisan is booted to monitor schedule, otherwise commands
            // registered via console.php file will not be available yet
            Event::listen(ArtisanStarting::class, function () use ($schedule) {
                $this->monitorSchedule($schedule);

                $defaultLocale = settings('locale.default', 'auto');
                if ($defaultLocale && $defaultLocale !== 'auto') {
                    app()->setLocale($defaultLocale);
                }
            });
        });
    }

    private function registerDevProviders(): void
    {
        if (!config('app.debug')) {
            return;
        }

        if (class_exists(ClockworkServiceProvider::class)) {
            $this->app->register(ClockworkServiceProvider::class);
        }
    }

    private function registerCollectionExtensions(): void
    {
        // convert all array items to lowercase
        Collection::macro('toLower', function ($key = null) {
            return $this->map(function ($value) use ($key) {
                // remove all whitespace and lowercase
                if (is_string($value)) {
                    return slugify($value, ' ');
                } else {
                    $value[$key] = slugify($value[$key], ' ');
                    return $value;
                }
            });
        });

        EloquentCollection::macro('makeUsersCompact', function (
            $extraFields = [],
        ): static {
            foreach ($this as $item) {
                if ($item instanceof BaseUser) {
                    $item->setVisible([...$extraFields, 'id', 'name', 'image']);
                } else {
                    foreach ($item->getRelations() as $name => $model) {
                        if ($model instanceof BaseUser) {
                            $model->setVisible([
                                ...$extraFields,
                                'id',
                                'name',
                                'image',
                            ]);
                        }
                    }
                }
            }
            return $this;
        });

        EloquentCollection::macro('makeUsersCompactWithEmail', function (
            $extraFields = [],
        ) {
            return $this->makeUsersCompact([...$extraFields, 'email']);
        });
    }

    protected function storageDriverSelected(string $name): bool
    {
        return config('filesystems.uploads_disk_driver') === $name ||
            config('filesystems.public_disk_driver') === $name;
    }

    private function registerEventListeners(): void
    {
        Event::listen(SettingsSaved::class, [
            SyncPlansWhenBillingSettingsChange::class,
            UpdateAllUsersLanguageWhenDefaultLocaleChanges::class,
        ]);
        Event::subscribe(OutgoingEmailLogSubscriber::class);
        Event::listen(
            FileUploaded::class,
            CreateThumbnailForUploadedFile::class,
        );

        if (config('app.workspaces_integrated')) {
            Event::listen(UsersDeleted::class, function (UsersDeleted $e) {
                $e->users->each(function (User $user) {
                    app(Workspace::class)
                        ->forUser($user->id)
                        ->get()
                        ->each(function (Workspace $workspace) use ($user) {
                            app(RemoveMemberFromWorkspace::class)->execute(
                                $workspace,
                                $user->id,
                            );
                        });
                    app(DeleteEntries::class)->execute([
                        'entryIds' => $user
                            ->entries()
                            ->pluck('file_entries.id'),
                    ]);
                });
            });
        }
    }

    public function registerCustomMailDrivers(): void
    {
        $this->app->get('mail.manager');
        $this->app->get('mail.manager')->extend('gmailApi', function () {
            return new GmailApiMailTransport();
        });

        $this->app->singleton(GmailClient::class);
    }

    private function setMorphMap(): void
    {
        Relation::enforceMorphMap([
            'post' => 'App\Models\Post',
            'video' => 'App\Models\Video',
            'workspace' => Workspace::class,
            User::MODEL_TYPE => User::class,
        ]);
    }
}
