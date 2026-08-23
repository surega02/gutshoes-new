<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::get('/health', function () {
        return response()->json(['data' => [
            'status' => 'ok',
            'service' => 'gutshoes-api',
            'timestamp' => now()->utc()->toIso8601String(),
        ]]);
    })->name('api.v1.health');
});
