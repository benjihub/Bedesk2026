<?php

use Envato\Http\Controllers\EnvatoController;
use Envato\Http\Controllers\EnvatoUpdatesController;
use Envato\Http\Controllers\UserEnvatoPurchasesController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'v1'], function () {
    Route::group(['middleware' => ['optionalAuth:sanctum', 'verified', 'verifyApiAccess']], function () {
        Route::post('envato/validate-purchase-code', [EnvatoController::class, 'validateCode']);
        Route::post('envato/items/import', [EnvatoController::class, 'importItems']);
        Route::put('envato/items/{envatoItemId}', [EnvatoUpdatesController::class, 'updateItem']);
        Route::get('users/{user}/envato/purchases', UserEnvatoPurchasesController::class);
        Route::post('users/{user}/envato/add-purchase-using-code', [EnvatoController::class, 'addPurchaseUsingCode']);
        Route::post('users/{user}/envato/sync-purchases', [EnvatoController::class, 'syncPurchases']);
        Route::get('reports/envato', [EnvatoController::class, 'envatoReport']);
    });
});
