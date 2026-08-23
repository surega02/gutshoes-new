<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::get('/health', fn () => response()->json(['data' => ['status' => 'ok', 'service' => 'gutshoes-api', 'timestamp' => now()->utc()->toIso8601String()]]))->name('api.v1.health');

    Route::middleware('web')->group(function (): void {
        Route::post('/admin/auth/login', [SessionController::class, 'adminLogin'])->middleware('throttle:auth');
        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/auth/me', [SessionController::class, 'me']);
            Route::post('/auth/logout', [SessionController::class, 'logout']);
            Route::get('/profile', [ProfileController::class, 'show']);
            Route::put('/profile', [ProfileController::class, 'update']);
            Route::apiResource('addresses', AddressController::class);
        });
    });
});
