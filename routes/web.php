<?php

use App\Http\Controllers\Api\EwsApiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EwsMonitoringController;
use App\Http\Controllers\GuruBK;
use App\Http\Controllers\GuruKelas;
use App\Http\Controllers\Kepsek;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - E-Jurnal STIKMAS (Early Warning System & AI Jurnal)
|--------------------------------------------------------------------------
|
| Seluruh rute aplikasi diatur dengan standar keamanan:
| 1. Authentication & Role-Based Access Control (RBAC).
| 2. Rate Limiting (Throttling) pada otentikasi dan inferensi AI.
| 3. Single-Page State Management via Inertia.js.
|
*/

// Root Redirect (Arahkan pengguna yang sudah login ke dashboard atau ke halaman login)
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

// ==========================================
// 1. Auth Routes (Public/Guest Only)
// ==========================================
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
});

// ==========================================
// 2. Authenticated Routes (Wajib Login)
// ==========================================
Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Central Role Dispatcher (/dashboard mengarahkan otomatis sesuai role user)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Shortcut Redirects ke Sub-dashboard resmi
    Route::get('/dashboard/guru-kelas', fn () => redirect()->route('guru-kelas.dashboard'));
    Route::get('/dashboard/guru-bk', fn () => redirect()->route('guru-bk.dashboard'));
    Route::get('/dashboard/kepsek', fn () => redirect()->route('kepsek.dashboard'));

    // Student 360 Profile & AI Advisor (Dapat diakses oleh seluruh pendidik terautentikasi)
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    Route::post('/students/{student}/ai-advice', [StudentController::class, 'generateAiAdvice'])
        ->name('students.ai-advice')
        ->middleware('throttle:15,1');

    // Radar EWS Moodle & Notifikasi AI (Multirole: Guru BK, Guru Kelas/Wali Kelas, Kepsek)
    Route::middleware(['role:guru_bk,guru_kelas,kepsek'])->group(function () {
        Route::get('/ews', [EwsMonitoringController::class, 'index'])->name('ews.index');
        Route::post('/ews/interventions', [EwsMonitoringController::class, 'storeIntervention'])->name('ews.interventions.store');
    });

    // Internal AI Structuring Helper APIs (Wajib terautentikasi & rate-limited)
    Route::post('/api/ai/structure-observation', [GuruKelas\ObservationController::class, 'structureWithAi'])
        ->name('api.ai.structure')
        ->middleware('throttle:30,1');
    Route::post('/api/ai/structure-bk-observation', [GuruBK\CaseController::class, 'structureWithAi'])
        ->name('api.ai.structure-bk')
        ->middleware('throttle:30,1');

    // ==========================================
    // Modul: Guru Kelas / Wali Kelas (Role: guru_kelas)
    // ==========================================
    Route::middleware(['role:guru_kelas'])->prefix('guru-kelas')->name('guru-kelas.')->group(function () {
        Route::get('/dashboard', [GuruKelas\DashboardController::class, 'index'])->name('dashboard');
        Route::post('/observations/ai-structure', [GuruKelas\ObservationController::class, 'structureWithAi'])
            ->name('observations.ai-structure')
            ->middleware('throttle:30,1');
        Route::post('/observations', [GuruKelas\ObservationController::class, 'store'])->name('observations.store');
        Route::post('/attendance/bulk', [GuruKelas\AttendanceController::class, 'storeBulk'])->name('attendance.bulk');
        Route::post('/academics', [GuruKelas\AcademicController::class, 'store'])->name('academics.store');
        Route::post('/academics/bulk', [GuruKelas\AcademicController::class, 'storeBulk'])->name('academics.bulk');
    });

    // ==========================================
    // Modul: Guru BK / Konselor (Role: guru_bk)
    // ==========================================
    Route::middleware(['role:guru_bk'])->prefix('guru-bk')->name('guru-bk.')->group(function () {
        Route::get('/dashboard', [GuruBK\DashboardController::class, 'index'])->name('dashboard');
        Route::post('/cases', [GuruBK\CaseController::class, 'store'])->name('cases.store');
        Route::patch('/cases/{bkCase}/status', [GuruBK\CaseController::class, 'updateStatus'])->name('cases.update-status');
    });

    // ==========================================
    // Modul: Kepala Sekolah (Role: kepsek)
    // ==========================================
    Route::middleware(['role:kepsek'])->prefix('kepsek')->name('kepsek.')->group(function () {
        Route::get('/dashboard', [Kepsek\DashboardController::class, 'index'])->name('dashboard');
        Route::post('/disposition', [Kepsek\DashboardController::class, 'storeDisposition'])->name('disposition');
    });
});

// ==========================================
// 3. EWS Moodle & WA Notification APIs
// ==========================================
Route::prefix('api/ews')->name('api.ews.')->group(function () {
    Route::get('/notifications', [EwsApiController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/{id}', [EwsApiController::class, 'show'])->name('notifications.show');
    Route::post('/notifications', [EwsApiController::class, 'store'])->name('notifications.store');
    Route::patch('/notifications/{id}/status', [EwsApiController::class, 'updateStatus'])->name('notifications.update-status');
    Route::post('/interventions', [EwsApiController::class, 'storeIntervention'])->name('interventions.store');
});

