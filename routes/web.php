<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuruBK;
use App\Http\Controllers\GuruKelas;
use App\Http\Controllers\Kepsek;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Sistem Informasi BK-EWS AI
|--------------------------------------------------------------------------
*/

// Auth Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Base Authenticated Route
Route::middleware(['auth'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Modul: Guru Kelas / Wali Kelas
    Route::middleware(['role:guru_kelas'])->prefix('guru-kelas')->name('guru-kelas.')->group(function () {
        Route::get('/dashboard', [GuruKelas\DashboardController::class, 'index'])->name('dashboard');
        Route::post('/observations/ai-structure', [GuruKelas\ObservationController::class, 'structureWithAi'])->name('observations.ai-structure');
        Route::post('/observations', [GuruKelas\ObservationController::class, 'store'])->name('observations.store');
        Route::post('/attendance/bulk', [GuruKelas\AttendanceController::class, 'storeBulk'])->name('attendance.bulk');
        Route::post('/academics', [GuruKelas\AcademicController::class, 'store'])->name('academics.store');
    });

    // Modul: Guru BK (Bimbingan Konseling)
    Route::middleware(['role:guru_bk'])->prefix('guru-bk')->name('guru-bk.')->group(function () {
        Route::get('/dashboard', [GuruBK\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/students/{student}', [GuruBK\StudentProfileController::class, 'show'])->name('students.show');
        Route::post('/students/{student}/ai-advice', [GuruBK\StudentProfileController::class, 'generateAiAdvice'])->name('students.ai-advice');
        Route::post('/cases', [GuruBK\CaseController::class, 'store'])->name('cases.store');
        Route::patch('/cases/{bkCase}/status', [GuruBK\CaseController::class, 'updateStatus'])->name('cases.update-status');
    });

    // Modul: Kepala Sekolah (Kepsek)
    Route::middleware(['role:kepsek'])->prefix('kepsek')->name('kepsek.')->group(function () {
        Route::get('/dashboard', [Kepsek\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/students/{student}', [Kepsek\StudentMonitorController::class, 'show'])->name('students.show');
    });
});
