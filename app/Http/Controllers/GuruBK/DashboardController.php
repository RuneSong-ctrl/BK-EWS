<?php

namespace App\Http\Controllers\GuruBK;

use App\Http\Controllers\Controller;
use App\Models\EwsCounselingJournal;
use App\Models\EwsStudentSummary;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Tampilkan antarmuka Dashboard Guru BK (Tier 2 Clinical Triage & Konseling)
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. Ambil data Triage Siswa Holistik
        $summariesQuery = EwsStudentSummary::with([
            'student.classes' => fn ($q) => $q->wherePivot('is_current', true),
            'counselingJournals.counselor',
        ]);

        if ($request->filled('priority') && $request->query('priority') !== 'ALL') {
            $summariesQuery->where('prioritas_konseling', strtoupper($request->query('priority')));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $summariesQuery->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        $studentSummaries = $summariesQuery
            ->orderByRaw("CASE 
                WHEN prioritas_konseling = 'TINGGI' THEN 1 
                WHEN prioritas_konseling = 'SEDANG' THEN 2 
                ELSE 3 END")
            ->orderBy('inaktivitas_terlama_hari', 'desc')
            ->get();

        // 2. Metrik Triage
        $allSummaries = EwsStudentSummary::all();
        $totalSummaries = $allSummaries->count();
        $highPriority = $allSummaries->where('prioritas_konseling', 'TINGGI')->count();
        $mediumPriority = $allSummaries->where('prioritas_konseling', 'SEDANG')->count();
        $lowPriority = $allSummaries->where('prioritas_konseling', 'RENDAH')->count();
        $inactiveCritical = $allSummaries->where('inaktivitas_terlama_hari', '>', 14)->count();
        $inCounseling = $allSummaries->where('status_penanganan', 'in_counseling')->count();

        $triageStats = [
            'total' => $totalSummaries,
            'high_priority' => $highPriority,
            'medium_priority' => $mediumPriority,
            'low_priority' => $lowPriority,
            'inactive_critical' => $inactiveCritical,
            'in_counseling' => $inCounseling,
        ];

        // 3. Jurnal Konseling Terkini
        $recentJournals = EwsCounselingJournal::with(['summary.student', 'counselor'])
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Dashboard/GuruBk', [
            'studentSummaries' => $studentSummaries,
            'stats' => $triageStats,
            'recentJournals' => $recentJournals,
            'counselorName' => $user?->name ?? 'Guru BK',
        ]);
    }
}
