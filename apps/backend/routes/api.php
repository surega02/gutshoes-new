<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AdminBrandController;
use App\Http\Controllers\Api\V1\AdminCategoryController;
use App\Http\Controllers\Api\V1\AdminFulfillmentController;
use App\Http\Controllers\Api\V1\AdminProductController;
use App\Http\Controllers\Api\V1\AdminSizeController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\CheckoutQuoteController;
use App\Http\Controllers\Api\V1\CustomerOrderController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::get('/health', fn () => response()->json(['data' => ['status' => 'ok', 'service' => 'gutshoes-api', 'timestamp' => now()->utc()->toIso8601String()]]))->name('api.v1.health');
    Route::get('/products', [CatalogController::class, 'index']);
    Route::get('/products/{slug}', [CatalogController::class, 'show']);
    Route::post('/payments/midtrans/webhook', [PaymentController::class, 'webhook'])->middleware('throttle:webhooks');
    Route::post('/orders/track', [CustomerOrderController::class, 'track'])->middleware('throttle:tracking');

    Route::middleware('web')->group(function (): void {
        Route::get('/cart', [CartController::class, 'show']);
        Route::post('/cart/items', [CartController::class, 'storeItem']);
        Route::patch('/cart/items/{item}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{item}', [CartController::class, 'deleteItem']);
        Route::post('/checkout/quote', CheckoutQuoteController::class)->middleware('throttle:checkout');
        Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:checkout');
        Route::post('/orders/{orderNumber}/payment', [PaymentController::class, 'store'])->middleware('throttle:checkout');
        Route::post('/admin/auth/login', [SessionController::class, 'adminLogin'])->middleware('throttle:auth');
        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/auth/me', [SessionController::class, 'me']);
            Route::post('/auth/logout', [SessionController::class, 'logout']);
            Route::get('/profile', [ProfileController::class, 'show']);
            Route::put('/profile', [ProfileController::class, 'update']);
            Route::apiResource('addresses', AddressController::class);
            Route::get('/orders', [CustomerOrderController::class, 'index']);
            Route::get('/orders/{orderNumber}', [CustomerOrderController::class, 'show']);
            Route::prefix('admin')->middleware('admin')->group(function (): void {
                Route::patch('/orders/{order}/fulfillment', [AdminFulfillmentController::class, 'update']);
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
