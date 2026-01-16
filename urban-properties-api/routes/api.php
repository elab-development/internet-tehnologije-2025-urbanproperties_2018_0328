<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ViewingAppointmentController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\AdminController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Buyer.
    Route::post('/viewing-appointments', [ViewingAppointmentController::class, 'store']);
    Route::get('/me/activities', [ViewingAppointmentController::class, 'myActivities']);
    Route::patch('/viewing-appointments/{viewingAppointment}/cancel', [ViewingAppointmentController::class, 'cancel']);

    Route::post('/offers', [OfferController::class, 'store']);
    Route::get('/offers/mine', [OfferController::class, 'mine']);
    Route::patch('/offers/{offer}/withdraw', [OfferController::class, 'withdraw']);

    // Sales agent.
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);

    Route::get('/agent/viewing-appointments', [ViewingAppointmentController::class, 'forMyProperties']);
    Route::patch('/viewing-appointments/{viewingAppointment}/status', [ViewingAppointmentController::class, 'updateStatus']);
    Route::get('/agent/offers', [OfferController::class, 'forMyProperties']);

    // Admin.
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/reports', [AdminController::class, 'reports']);
    Route::get('/admin/metrics', [AdminController::class, 'metrics']);
});
