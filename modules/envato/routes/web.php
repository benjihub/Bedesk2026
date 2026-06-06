<?php

use Envato\Http\Controllers\EnvatoUpdatesController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

Route::post('envato/updates/get-download-url', [EnvatoUpdatesController::class, 'getUpdateDownloadUrl'])
->middleware([
    'throttle:20,1',
])->withoutMiddleware(VerifyCsrfToken::class);

Route::post('envato/register-purchase-code', [EnvatoUpdatesController::class, 'registerPurchaseCode'])
->middleware([
    'throttle:20,1',
])->withoutMiddleware(VerifyCsrfToken::class);

Route::get('envato/updates/get-latest-version', [EnvatoUpdatesController::class, 'getLatestVersion'])
->middleware([
    'throttle:20,1',
])->withoutMiddleware(VerifyCsrfToken::class);
