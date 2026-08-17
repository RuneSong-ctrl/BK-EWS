<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuruBK;
use App\Http\Controllers\GuruKelas;
use App\Http\Controllers\Kepsek;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes - Sistem Informasi BK-EWS AI
|--------------------------------------------------------------------------
*/

// Root Redirect
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

// Auth Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);

// Standalone Demo / Direct Dashboard Access Routes
Route::get('/dashboard/guru-kelas', [GuruKelas\DashboardController::class, 'index'])->name('dashboard.guru-kelas');
Route::get('/dashboard/guru-bk', [GuruBK\DashboardController::class, 'index'])->name('dashboard.guru-bk');
Route::get('/dashboard/kepsek', [Kepsek\DashboardController::class, 'index'])->name('dashboard.kepsek');

// Standalone Student Show Route (with student model binding or fallback)
Route::get('/students/{student}', [GuruBK\StudentProfileController::class, 'show'])->name('students.show');

// Public AI Structuring Helper API
Route::post('/api/ai/structure-observation', [GuruKelas\ObservationController::class, 'structureWithAi'])->name('api.ai.structure');
Route::post('/api/ai/structure-bk-observation', [GuruBK\CaseController::class, 'structureWithAi'])->name('api.ai.structure-bk');

// Base Authenticated Route
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/students/{student}/ai-advice', [GuruBK\StudentProfileController::class, 'generateAiAdvice'])->name('students.ai-advice');

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
