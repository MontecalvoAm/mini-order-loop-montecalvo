<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Models\Item;
use App\Http\Controllers\ApiResponseTrait;

use App\Http\Controllers\OrderStatusController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    Route::get('/items', function () {
        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data' => Item::all(),
            'errors' => (object)[]
        ]);
    });

    Route::apiResource('orders', OrderController::class);
    
    // Status Transitions
    Route::post('/orders/{order}/submit', [OrderStatusController::class, 'submit']);
    Route::post('/orders/{order}/approve', [OrderStatusController::class, 'approve']);
    Route::post('/orders/{order}/reject', [OrderStatusController::class, 'reject']);
    Route::post('/orders/{order}/revise', [OrderStatusController::class, 'revise']);
    Route::post('/orders/{order}/fulfill', [OrderStatusController::class, 'fulfill']);
    Route::post('/orders/{order}/close', [OrderStatusController::class, 'close']);
    Route::post('/orders/{order}/cancel', [OrderStatusController::class, 'cancel']);
});
