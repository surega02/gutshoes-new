<?php

use App\Http\Controllers\Api\V1\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/up');
Route::prefix('api/v1/auth/google')->middleware('throttle:auth')->group(function (): void {
    Route::get('/', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
});
