<?php

use App\Http\Controllers\Api\V1\AreaDataController;
use App\Http\Controllers\Api\V1\PredictionImportController;
use App\Http\Controllers\Api\V1\EnvironmentDiscoveryController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/areas', [AreaDataController::class, 'index']);
Route::get('/v1/areas/{slug}/risk', [AreaDataController::class, 'risk']);
Route::get('/v1/areas/{slug}/rainfall', [AreaDataController::class, 'rainfall']);
Route::get('/v1/areas/{slug}/current-weather', [AreaDataController::class, 'currentWeather']);
Route::get('/v1/areas/{slug}', [AreaDataController::class, 'show']);
Route::get('/v1/predictions/latest', [AreaDataController::class, 'latestPredictions']);
Route::get('/v1/flood-events/years', [AreaDataController::class, 'floodEventYears']);
Route::get('/v1/flood-events', [AreaDataController::class, 'floodEvents']);
Route::post('/v1/predictions/import', [PredictionImportController::class, 'store']);
Route::get('/v1/areas/{slug}/environment-discovery', [EnvironmentDiscoveryController::class, 'show'])
    ->middleware('throttle:10,1');
