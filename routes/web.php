<?php

use App\Http\Controllers\HashController;
use Illuminate\Support\Facades\Route;

// Page principale du générateur de hash
Route::get('/', [HashController::class, 'index'])->name('home');

// Routes pour le générateur de hash
Route::prefix('hash')->group(function () {
    Route::get('/', [HashController::class, 'index'])->name('hash.index');

    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/generate', [HashController::class, 'generate'])->name('hash.generate');
        Route::post('/generate-all', [HashController::class, 'generateAll'])->name('hash.generate-all');
        Route::post('/verify', [HashController::class, 'verify'])->name('hash.verify');
        Route::post('/bcrypt-custom', [HashController::class, 'generateCustomBcrypt'])->name('hash.bcrypt-custom');
    });
});
