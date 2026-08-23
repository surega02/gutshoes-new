<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AdminBrandController;
use App\Http\Controllers\Api\V1\AdminCategoryController;
use App\Http\Controllers\Api\V1\AdminProductController;
use App\Http\Controllers\Api\V1\AdminSizeController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::get('/health', fn () => response()->json(['data' => ['status' => 'ok', 'service' => 'gutshoes-api', 'timestamp' => now()->utc()->toIso8601String()]]))->name('api.v1.health');
    Route::get('/products', [CatalogController::class, 'index']);
    Route::get('/products/{slug}', [CatalogController::class, 'show']);

    Route::middleware('web')->group(function (): void {
        Route::post('/admin/auth/login', [SessionController::class, 'adminLogin'])->middleware('throttle:auth');
        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/auth/me', [SessionController::class, 'me']);
            Route::post('/auth/logout', [SessionController::class, 'logout']);
            Route::get('/profile', [ProfileController::class, 'show']);
            Route::put('/profile', [ProfileController::class, 'update']);
            Route::apiResource('addresses', AddressController::class);
            Route::prefix('admin')->middleware('admin')->group(function (): void {
                Route::apiResource('brands', AdminBrandController::class);
                Route::apiResource('categories', AdminCategoryController::class);
                Route::apiResource('sizes', AdminSizeController::class)->except('show');
                Route::apiResource('products', AdminProductController::class);
                Route::post('/products/{product}/publish', [AdminProductController::class, 'publish']);
                Route::post('/products/{product}/images', [AdminProductController::class, 'uploadImage']);
                Route::delete('/products/{product}/images/{image}', [AdminProductController::class, 'deleteImage']);
            });
        });
    });
});
