<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\CourseMapping;
use App\Models\EwsCourseAlert;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Update status tindak lanjut alert siswa oleh Guru Mapel (Inertia native)
     */
    public function updateAlertStatus(Request $request, int $id): RedirectResponse
    {
        $alert = EwsCourseAlert::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,konfirmasi_tugas,remedial,selesai',
            'catatan_guru_mapel' => 'nullable|string|max:1000',
        ]);

        $alert->update($validated);

        return redirect()->back()->with('success', "Status tindak lanjut siswa {$alert->student?->name} ({$alert->kode_modul}) berhasil diperbarui.");
    }
    /**
     * Tampilkan antarmuka Dashboard Guru Mata Pelajaran (Tier 1 Moodle EWS)
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. Ambil seluruh mata pelajaran terpetakan
        $courses = CourseMapping::orderBy('code_module')->get();
        
        // Modul aktif: dari query param atau default kursus pertama (AAA)
        $selectedModule = $request->query('module', $courses->first()?->code_module ?? 'AAA');
        $activeCourse = CourseMapping::where('code_module', $selectedModule)->first() ?? $courses->first();

        // 2. Ambil alert siswa untuk kursus yang dipilih
        $alertsQuery = EwsCourseAlert::with('student')
            ->where('kode_modul', $selectedModule);

        if ($request->filled('risk_level') && $request->query('risk_level') !== 'ALL') {
            $alertsQuery->where('tingkat_risiko', strtoupper($request->query('risk_level')));
        }

        if ($request->filled('status') && $request->query('status') !== 'ALL') {
            $alertsQuery->where('status', strtolower($request->query('status')));
        }

        $courseAlerts = $alertsQuery->orderBy('probabilitas_risiko', 'desc')->get();

        // 3. Statistik Metrik Kursus (Tier 1)
        $allAlertsInCourse = EwsCourseAlert::where('kode_modul', $selectedModule)->get();
        $totalInCourse = $allAlertsInCourse->count();
        $highRisk = $allAlertsInCourse->where('tingkat_risiko', 'TINGGI')->count();
        $mediumRisk = $allAlertsInCourse->where('tingkat_risiko', 'SEDANG')->count();
        $lowRisk = $allAlertsInCourse->where('tingkat_risiko', 'RENDAH')->count();
        $avgDuration = $totalInCourse > 0 ? round($allAlertsInCourse->avg('durasi_belajar_jam'), 1) : 0.0;
        $totalMissingTasks = $allAlertsInCourse->sum('tugas_belum_dikumpul');
        $handledCount = $allAlertsInCourse->whereIn('status', ['konfirmasi_tugas', 'remedial', 'selesai'])->count();

        $courseStats = [
            'total_students' => $totalInCourse,
            'high_risk_count' => $highRisk,
            'medium_risk_count' => $mediumRisk,
            'low_risk_count' => $lowRisk,
            'avg_duration_hours' => $avgDuration,
            'total_missing_tasks' => $totalMissingTasks,
            'handled_count' => $handledCount,
        ];

        return Inertia::render('Dashboard/GuruKelas', [
            'courses' => $courses,
            'activeCourse' => $activeCourse,
            'selectedModule' => $selectedModule,
            'courseAlerts' => $courseAlerts,
            'stats' => $courseStats,
            'teacherName' => $activeCourse?->nama_guru_mapel ?? $user->name,
        ]);
    }
}
