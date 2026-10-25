<?php

use App\Http\Controllers\Api\BotController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GateUserSyncController;
use App\Http\Controllers\MasterQuranController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RekapSetoranController;
use App\Http\Controllers\RekapSiswaController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\SetoranController;
use App\Http\Controllers\SiswaController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UstadzController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Bot endpoints fallback for compatibility with /bot/* and double-slash normalization
Route::prefix('bot')->middleware('bot.secret')->group(function () {
    Route::get('manifest', [BotController::class, 'manifest']);
    Route::post('query', [BotController::class, 'query']);
    Route::post('{action}', [BotController::class, 'handleAction']);
});

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('feature:dashboard,view')
        ->name('dashboard');

    Route::get('/input-setoran', [SetoranController::class, 'create'])
        ->middleware('feature:input_setoran,manage')
        ->name('input.setoran');

    Route::post('/input-setoran', [SetoranController::class, 'store'])
        ->middleware('feature:input_setoran,manage')
        ->name('input.setoran.store');

    Route::prefix('rekap-setoran')->middleware('feature:rekap_setoran,view')->group(function () {
        Route::get('/', [RekapSetoranController::class, 'index'])->name('rekap.setoran');
        Route::delete('/{id}', [RekapSetoranController::class, 'destroy'])->middleware('feature:rekap_setoran,manage')->name('rekap.setoran.destroy');
        Route::post('/bulk-action', [RekapSetoranController::class, 'bulkAction'])->middleware('feature:rekap_setoran,manage')->name('rekap.setoran.bulk-action');
    });

    Route::prefix('rekap-siswa')->middleware('feature:rekap_siswa,view')->group(function () {
        Route::get('/', [RekapSiswaController::class, 'index'])->name('rekap.siswa');
        Route::get('/export-csv', [RekapSiswaController::class, 'exportCsvAll'])->name('rekap.siswa.csv');
        Route::get('/export-pdf', [RekapSiswaController::class, 'exportPdfAll'])->name('rekap.siswa.pdf');
        Route::get('/{id}/export-csv', [RekapSiswaController::class, 'exportCsvSingle'])->name('rekap.siswa.csv.single');
        Route::get('/{id}/export-pdf', [RekapSiswaController::class, 'exportPdfSingle'])->name('rekap.siswa.pdf.single');
    });

    // Rute Kelompok Data Master Siswa
    Route::prefix('database-siswa')->middleware('feature:master_siswa,view')->group(function () {
        Route::get('/', [SiswaController::class, 'index'])->name('master.siswa');
        Route::get('/template', [SiswaController::class, 'downloadTemplate'])->name('siswa.template');
        Route::post('/dry-run', [SiswaController::class, 'dryRun'])->middleware('feature:master_siswa,manage')->name('master.siswa.dry-run');
        Route::post('/apply-import', [SiswaController::class, 'applyImport'])->middleware('feature:master_siswa,manage')->name('master.siswa.apply-import');
        Route::post('/bulk-action', [SiswaController::class, 'bulkAction'])->middleware('feature:master_siswa,manage')->name('master.siswa.bulk-action');
        Route::post('/', [SiswaController::class, 'store'])->middleware('feature:master_siswa,manage')->name('master.siswa.store');
        Route::post('/upload', [SiswaController::class, 'import'])->middleware('feature:master_siswa,manage')->name('master.siswa.upload');
        Route::put('/{id}', [SiswaController::class, 'update'])->middleware('feature:master_siswa,manage')->name('master.siswa.update');
        Route::delete('/{id}', [SiswaController::class, 'destroy'])->middleware('feature:master_siswa,manage')->name('master.siswa.destroy');
    });

    // Rute Kelompok Data Master Ustadz
    Route::prefix('database-ustadz')->middleware('feature:master_ustadz,view')->group(function () {
        Route::get('/', [UstadzController::class, 'index'])->name('master.ustadz');
        Route::get('/template', [UstadzController::class, 'downloadTemplate'])->name('ustadz.template');
        Route::post('/bulk-action', [UstadzController::class, 'bulkAction'])->middleware('feature:master_ustadz,manage')->name('master.ustadz.bulk-action');
        Route::post('/', [UstadzController::class, 'store'])->middleware('feature:master_ustadz,manage')->name('master.ustadz.store');
        Route::put('/{id}', [UstadzController::class, 'update'])->middleware('feature:master_ustadz,manage')->name('master.ustadz.update');
        Route::delete('/{id}', [UstadzController::class, 'destroy'])->middleware('feature:master_ustadz,manage')->name('master.ustadz.destroy');
        Route::post('/upload', [UstadzController::class, 'import'])->middleware('feature:master_ustadz,manage')->name('master.ustadz.upload');
    });

    Route::get('/master-quran', [MasterQuranController::class, 'index'])
        ->middleware('feature:master_quran,view')
        ->name('master.quran');

    // Kelompok Route Kelola User
    Route::prefix('kelola-user')->middleware('feature:kelola_user,view')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('kelola.user');
        Route::post('/bulk-action', [UserController::class, 'bulkAction'])->middleware('feature:kelola_user,manage')->name('kelola.user.bulk-action');
        Route::post('/', [UserController::class, 'store'])->middleware('feature:kelola_user,manage')->name('kelola.user.store');
        Route::put('/{id}', [UserController::class, 'update'])->middleware('feature:kelola_user,manage')->name('kelola.user.update');
        Route::delete('/{id}', [UserController::class, 'destroy'])->middleware('feature:kelola_user,manage')->name('kelola.user.destroy');
        Route::post('/generate', [UserController::class, 'generateAccounts'])->middleware('feature:kelola_user,manage')->name('kelola.user.generate');
    });

    // Kelompok Route Sinkronisasi Gate SSO
    Route::prefix('sync-sso')->middleware('feature:sync_sso,view')->group(function () {
        Route::get('/', [GateUserSyncController::class, 'index'])->name('sync.sso');
        Route::post('/settings', [GateUserSyncController::class, 'updateSettings'])->middleware('feature:sync_sso,manage')->name('sync.sso.settings');
        Route::post('/test-connection', [GateUserSyncController::class, 'testConnection'])->middleware('feature:sync_sso,manage')->name('sync.sso.test-connection');
        Route::post('/dry-run', [GateUserSyncController::class, 'dryRun'])->middleware('feature:sync_sso,manage')->name('sync.sso.dry-run');
        Route::post('/apply', [GateUserSyncController::class, 'apply'])->middleware('feature:sync_sso,manage')->name('sync.sso.apply');
    });

    // Kelompok Route Hak Akses (RBAC)
    Route::prefix('kelola-hak-akses')->middleware('feature:kelola_hak_akses,view')->group(function () {
        Route::get('/', [RolePermissionController::class, 'index'])->name('kelola.hak-akses');
        Route::post('/', [RolePermissionController::class, 'update'])->middleware('feature:kelola_hak_akses,manage')->name('kelola.hak-akses.update');
        Route::post('/reset', [RolePermissionController::class, 'reset'])->middleware('feature:kelola_hak_akses,manage')->name('kelola.hak-akses.reset');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
