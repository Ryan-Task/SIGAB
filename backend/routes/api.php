<?php

use App\Http\Controllers\Api\V1\AreaDataController;
use App\Http\Controllers\Api\V1\PredictionImportController;
use App\Http\Controllers\Api\V1\EnvironmentDiscoveryController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/auth/request-code', [AuthController::class, 'requestCode'])->middleware('throttle:5,1');
Route::post('/auth/verify-code', [AuthController::class, 'verifyCode'])->middleware('throttle:10,1');
Route::post('/auth/password/forgot-code', [AuthController::class, 'requestPasswordResetCode'])->middleware('throttle:5,1');
Route::post('/auth/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
Route::post('/auth/email-login', [AuthController::class, 'emailLogin'])->middleware('throttle:10,1');
Route::post('/auth/admin-login', [AuthController::class, 'adminLogin'])->middleware('throttle:10,1');
Route::get('/auth/google/redirect', [AuthController::class, 'googleRedirect']);
Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);
Route::get('/auth/push/public-key', [AuthController::class, 'pushPublicKey']);
Route::middleware('auth.token')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/settings', [AuthController::class, 'updateSettings']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/password/change-code', [AuthController::class, 'requestPasswordChangeCode'])->middleware('throttle:5,1');
    Route::put('/auth/password', [AuthController::class, 'updatePassword'])->middleware('throttle:10,1');
    Route::get('/auth/locations', [AuthController::class, 'locations']);
    Route::post('/auth/locations', [AuthController::class, 'addLocation']);
    Route::delete('/auth/locations/{locationId}', [AuthController::class, 'removeLocation']);
    Route::post('/auth/push/subscribe', [AuthController::class, 'subscribePush']);
    Route::delete('/auth/push/subscribe', [AuthController::class, 'unsubscribePush']);
    Route::get('/admin/dashboard', [AuthController::class, 'adminDashboard']);
    Route::get('/admin/users', [AuthController::class, 'adminUsers']);
    Route::post('/admin/users/admin', [AuthController::class, 'createAdminUser']);
    Route::patch('/admin/users/{userId}/block', [AuthController::class, 'blockUser']);
    Route::delete('/admin/users/{userId}', [AuthController::class, 'deleteUser']);
    Route::post('/admin/history/import', [AuthController::class, 'importAdminHistory']);
});

Route::get('/v1/areas', [AreaDataController::class, 'index']);
Route::get('/v1/areas/{slug}/risk', [AreaDataController::class, 'risk']);
Route::get('/v1/areas/{slug}/rainfall', [AreaDataController::class, 'rainfall']);
Route::get('/v1/areas/{slug}/current-weather', [AreaDataController::class, 'currentWeather']);
Route::get('/v1/areas/{slug}', [AreaDataController::class, 'show']);
Route::get('/v1/predictions/latest', [AreaDataController::class, 'latestPredictions']);
Route::get('/v1/flood-events/years', [AreaDataController::class, 'floodEventYears']);
Route::get('/v1/flood-events', [AreaDataController::class, 'floodEvents']);
Route::get('/v1/history/summary', [AreaDataController::class, 'historySummary']);
Route::post('/v1/predictions/import', [PredictionImportController::class, 'store']);
Route::get('/v1/areas/{slug}/environment-discovery', [EnvironmentDiscoveryController::class, 'show'])
    ->middleware('throttle:10,1');
