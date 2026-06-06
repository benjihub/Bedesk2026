<?php

use App\Features\Whatsapp\Http\Controllers\WhatsappMessageController;
use App\Features\Whatsapp\Http\Controllers\WhatsappWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('whatsapp')->group(function () {
    // Exempt webhook and message endpoints from VerifyApiAccessMiddleware so
    // external services (Meta, ngrok) can POST without app-level API permissions.
    Route::get('webhook', [WhatsappWebhookController::class, 'verify'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    Route::post('webhook', [WhatsappWebhookController::class, 'handle'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

    Route::post('messages', [WhatsappMessageController::class, 'send'])
        ->withoutMiddleware(\Common\Auth\Middleware\VerifyApiAccessMiddleware::class)
        ->withoutMiddleware(\Common\Core\Middleware\EnsureFrontendRequestsAreStateful::class)
        ->withoutMiddleware(\Common\Core\Middleware\VerifyCsrfToken::class)
        ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
});
