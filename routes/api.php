<?php

use App\Http\Controllers\Api\BotController;
use Illuminate\Support\Facades\Route;

Route::prefix('bot')->middleware('bot.secret')->group(function () {
    Route::get('manifest', [BotController::class, 'manifest']);
    Route::post('query', [BotController::class, 'query']);
    Route::post('{action}', [BotController::class, 'handleAction']);
});
