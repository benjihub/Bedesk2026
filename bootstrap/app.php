<?php

use App\Core\Middleware\ConfigureCookies;
use Common\Core\Application;
use Common\Core\Middleware\BroadcastServiceProvider;

return Application::create(
    basePath: dirname(__DIR__),
    providers: [BroadcastServiceProvider::class],
    middleware: [ConfigureCookies::class],
);
