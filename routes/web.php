<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GateUserSyncController;
use App\Http\Controllers\MasterQuranController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RekapSetoranController;
use App\Http\Controllers\RekapSiswaController;
use App\Http\Controllers\SetoranController;
use App\Http\Controllers\SiswaController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UstadzController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('/input-setoran', [SetoranController::class, 'create'])
    ->middleware(['auth', 'verified'])
    ->name('input.setoran');

Route::post('/input-setoran', [SetoranController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('input.setoran.store');

Route::get('/rekap-setoran', [RekapSetoranController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('rekap.setoran');

Route::get('/rekap-siswa', [RekapSiswaController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('rekap.siswa');

Route::get('/rekap-siswa/export-csv', [RekapSiswaController::class, 'exportCsvAll'])
    ->middleware(['auth', 'verified'])->name('rekap.siswa.csv');

Route::get('/rekap-siswa/export-pdf', [RekapSiswaController::class, 'exportPdfAll'])
    ->middleware(['auth', 'verified'])->name('rekap.siswa.pdf');

Route::get('/rekap-siswa/{id}/export-csv', [RekapSiswaController::class, 'exportCsvSingle'])
    ->middleware(['auth', 'verified'])->name('rekap.siswa.csv.single');

Route::get('/rekap-siswa/{id}/export-pdf', [RekapSiswaController::class, 'exportPdfSingle'])
    ->middleware(['auth', 'verified'])->name('rekap.siswa.pdf.single');

// Rute Kelompok Data Master
// Rute untuk menampilkan halaman (namanya tetap 'master.siswa' agar sidebar tetap menyala)
Route::get('/database-siswa', [SiswaController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('master.siswa');

// Rute untuk mengunduh template upload
Route::get('/database-siswa/template', [SiswaController::class, 'downloadTemplate'])
    ->middleware(['auth', 'verified'])->name('siswa.template');

// Rute untuk memproses form Tambah Siswa
Route::post('/database-siswa', [SiswaController::class, 'store'])
    ->middleware(['auth', 'verified'])->name('master.siswa.store');

// Rute untuk memproses file Upload Massal CSV
Route::post('/database-siswa/upload', [SiswaController::class, 'import'])
    ->middleware(['auth', 'verified'])->name('master.siswa.upload');

// Rute untuk Edit dan Hapus Siswa
Route::put('/database-siswa/{id}', [SiswaController::class, 'update'])->middleware(['auth', 'verified'])->name('master.siswa.update');
Route::delete('/database-siswa/{id}', [SiswaController::class, 'destroy'])->middleware(['auth', 'verified'])->name('master.siswa.destroy');

// --- KELOMPOK ROUTE DATABASE USTADZ ---
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/database-ustadz', [UstadzController::class, 'index'])->name('master.ustadz');
    Route::post('/database-ustadz', [UstadzController::class, 'store'])->name('master.ustadz.store');
    Route::put('/database-ustadz/{id}', [UstadzController::class, 'update'])->name('master.ustadz.update');
    Route::delete('/database-ustadz/{id}', [UstadzController::class, 'destroy'])->name('master.ustadz.destroy');
    Route::get('/database-ustadz/template', [UstadzController::class, 'downloadTemplate'])->name('ustadz.template');
    Route::post('/database-ustadz/upload', [UstadzController::class, 'import'])->name('master.ustadz.upload');

    Route::get('/master-quran', [MasterQuranController::class, 'index'])->name('master.quran');

    // --- KELOMPOK ROUTE KELOLA USER ---
    Route::get('/kelola-user', [UserController::class, 'index'])->name('kelola.user');
    Route::post('/kelola-user', [UserController::class, 'store'])->name('kelola.user.store');
    Route::put('/kelola-user/{id}', [UserController::class, 'update'])->name('kelola.user.update');
    Route::delete('/kelola-user/{id}', [UserController::class, 'destroy'])->name('kelola.user.destroy');
    Route::post('/kelola-user/generate', [UserController::class, 'generateAccounts'])->name('kelola.user.generate');

    // --- KELOMPOK ROUTE SINKRONISASI GATE SSO ---
    Route::get('/sync-sso', [GateUserSyncController::class, 'index'])->name('sync.sso');
    Route::post('/sync-sso/dry-run', [GateUserSyncController::class, 'dryRun'])->name('sync.sso.dry-run');
    Route::post('/sync-sso/apply', [GateUserSyncController::class, 'apply'])->name('sync.sso.apply');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
