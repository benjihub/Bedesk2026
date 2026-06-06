<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of the routes that are handled
| by your application. Just tell Laravel the URIs it should respond
| to using a Closure or controller method. Build something great!
|
*/

use App\Core\Controllers\ResetPasswordController;
use App\HelpCenter\Controllers\HcArticleController;
use App\HelpCenter\Controllers\HcArticleSearchController;
use App\HelpCenter\Controllers\HcCategoryController;
use App\HelpCenter\Controllers\HcLandingPageController;
use App\HelpCenter\Controllers\SearchTermController;
use App\Team\Controllers\AgentInvitesController;
use App\Webhooks\Controllers\EmailApiWebhookController;
use App\Webhooks\Controllers\GmailWebhookController;
use App\Webhooks\Controllers\MailgunWebhookController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

// Debug route to test authentication
Route::get('/test-auth', function () {
    $user = auth()->user();
    return response()->json([
        'authenticated' => $user ? true : false,
        'user_id' => $user?->id,
        'user_email' => $user?->email,
    ]);
})->middleware(['web']);

// todo: check if custom localization file is not deleted on test side during auto-update

Route::get('agents/join/{inviteId}', [AgentInvitesController::class, 'show']);

Route::post('auth/forgot-password', [ResetPasswordController::class, 'sendResetPasswordLink'])
    ->middleware(['guest:'.config('fortify.guard')])
    ->name('password.request');
Route::post('auth/reset-password', [ResetPasswordController::class, 'resetPassword'])
    ->middleware(['guest:'.config('fortify.guard')])
    ->name('password.email');

//SEARCH TERM LOGGING
Route::post('search-term', [SearchTermController::class, 'storeSearchSession']);

//TICKETS MAIL WEBHOOKS
Route::post('tickets/mail/incoming', [
    EmailApiWebhookController::class,
    'handleIncoming',
])->withoutMiddleware(VerifyCsrfToken::class);

Route::post('tickets/mail/failed', [
    EmailApiWebhookController::class,
    'handleFailed',
])->withoutMiddleware(VerifyCsrfToken::class);

Route::post('tickets/mail/incoming/mailgun', [
    MailgunWebhookController::class,
    'handleIncoming',
])->withoutMiddleware(VerifyCsrfToken::class);

Route::post('tickets/mail/failed/mailgun', [
    MailgunWebhookController::class,
    'handleFailed',
])->withoutMiddleware(VerifyCsrfToken::class);

Route::post('tickets/mail/incoming/gmail', [
    GmailWebhookController::class,
    'handle',
])->withoutMiddleware(VerifyCsrfToken::class);

//FRONT-END ROUTES THAT NEED TO BE PRE-RENDERED
Route::get('/', HcLandingPageController::class);
Route::get('hc', HcLandingPageController::class);
Route::get('hc/articles/{articleId}/{slug}', [HcArticleController::class, 'show']);
Route::get('hc/articles/{categoryId}/{sectionId}/{articleId}/{slug}', [HcArticleController::class, 'show']);
Route::get('hc/categories/{categoryId}/{sectionId}/{slug}', [HcCategoryController::class, 'show']);
Route::get('hc/categories/{categoryId}/{slug}', [HcCategoryController::class, 'show']);
Route::get('hc/search/{query}', HcArticleSearchController::class);


Route::fallback(function () {
    if (request()->is('api/*')) {
        return response()->json(['message' => 'Not Found'], 404);
    }

    return app(\Common\Core\Controllers\HomeController::class)->show();
});
