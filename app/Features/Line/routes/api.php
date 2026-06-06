<?php

use Illuminate\Support\Facades\Route;

Route::prefix('line')->group(function () {
    // Exempt webhook and message endpoints from VerifyApiAccessMiddleware so
    // external services (LINE, ngrok) can POST without app-level API permissions.
    Route::get('webhook', [\App\Features\Line\Http\Controllers\LineWebhookController::class, 'verify'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    Route::post('webhook', [\App\Features\Line\Http\Controllers\LineWebhookController::class, 'handle'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    Route::post('messages', [\App\Features\Line\Http\Controllers\LineMessageController::class, 'send'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
});
