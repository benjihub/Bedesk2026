<?php

use Illuminate\Support\Facades\Route;

Route::prefix('telegram')->group(function () {
    Route::get('webhook', [\App\Features\Telegram\Http\Controllers\TelegramWebhookController::class, 'verify'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    Route::post('webhook', [\App\Features\Telegram\Http\Controllers\TelegramWebhookController::class, 'handle'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    Route::post('messages', [\App\Features\Telegram\Http\Controllers\TelegramMessageController::class, 'send'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
});
