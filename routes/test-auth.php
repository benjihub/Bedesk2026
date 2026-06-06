<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-auth', function () {
    $user = auth()->user();
    
    return response()->json([
        'authenticated' => $user ? true : false,
        'user_id' => $user?->id,
        'user_email' => $user?->email,
        'session_id' => session()->getId(),
        'has_session' => session()->has('_token'),
    ]);
});
