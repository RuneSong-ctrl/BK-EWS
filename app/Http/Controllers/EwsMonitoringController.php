<?php

namespace App\Http\Controllers;

use App\Models\EwsCounselingJournal;
use App\Models\EwsCourseAlert;
use App\Models\EwsStudentSummary;
use App\Models\SchoolClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EwsMonitoringController extends Controller
{
    /**
     * Tampilkan Halaman Monitoring EWS Moodle 2-Tier
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Ambil data Tier 1 (Alert Per Mapel)
        $courseAlertsQuery = EwsCourseAlert::with('student');
        if ($request->filled('kode_modul') && $request->query('kode_modul') !== 'ALL') {
            $courseAlertsQuery->where('kode_modul', $request->query('kode_modul'));
        }
        if ($request->filled('tingkat_risiko') && $request->query('tingkat_risiko') !== 'ALL') {
            $courseAlertsQuery->where('tingkat_risiko', strtoupper($request->query('tingkat_risiko')));
        }
        $courseAlerts = $courseAlertsQuery->orderBy('probabilitas_risiko', 'desc')->get();

        // Ambil data Tier 2 (Rekapitulasi Karakter Belajar BK)
        $studentSummaries = EwsStudentSummary::with(['student', 'counselingJournals.counselor'])
            ->orderByRaw("CASE 
                WHEN prioritas_konseling = 'TINGGI' THEN 1 
                WHEN prioritas_konseling = 'SEDANG' THEN 2 
                ELSE 3 END")
            ->orderBy('inaktivitas_terlama_hari', 'desc')
            ->get();

        // Metrik Ringkas
        $totalAlerts = EwsCourseAlert::count();
        $highRiskAlerts = EwsCourseAlert::where('tingkat_risiko', 'TINGGI')->count();
        $handledAlerts = EwsCourseAlert::whereIn('status', ['konfirmasi_tugas', 'remedial', 'selesai'])->count();

        $totalSummaries = EwsStudentSummary::count();
        $highPrioritySummaries = EwsStudentSummary::where('prioritas_konseling', 'TINGGI')->count();
        $inactiveCritical = EwsStudentSummary::where('inaktivitas_terlama_hari', '>', 14)->count();

        $stats = [
            'total_alerts' => $totalAlerts,
            'high_risk_alerts' => $highRiskAlerts,
            'handled_alerts' => $handledAlerts,
            'total_summaries' => $totalSummaries,
            'high_priority_summaries' => $highPrioritySummaries,
            'inactive_critical' => $inactiveCritical,
        ];

        return Inertia::render('Dashboard/EwsMonitoring', [
            'courseAlerts' => $courseAlerts,
            'studentSummaries' => $studentSummaries,
            'stats' => $stats,
            'userRole' => $user->role,
        ]);
    }

    /**
     * Catat Tindak Lanjut Konseling BK
     */
    public function storeIntervention(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'summary_id' => 'required|exists:ews_student_summaries,id',
            'jenis_layanan' => 'required|in:konseling_individu,pemanggilan_siswa,home_visit,koordinasi_ortu',
            'catatan_konseling' => 'required|string',
            'rencana_tindak_lanjut' => 'required|string',
            'evaluasi_perilaku' => 'nullable|in:membaik,tetap,memburuk',
            'tanggal_monitoring_berikutnya' => 'nullable|date',
        ]);

        $user = $request->user();

        EwsCounselingJournal::create([
            'summary_id' => $validated['summary_id'],
            'guru_bk_id' => $user->id,
            'jenis_layanan' => $validated['jenis_layanan'],
            'catatan_konseling' => $validated['catatan_konseling'],
            'rencana_tindak_lanjut' => $validated['rencana_tindak_lanjut'],
            'evaluasi_perilaku' => $validated['evaluasi_perilaku'] ?? null,
            'tanggal_monitoring_berikutnya' => $validated['tanggal_monitoring_berikutnya'] ?? null,
        ]);

        EwsStudentSummary::where('id', $validated['summary_id'])->update(['status_penanganan' => 'in_counseling']);

        return redirect()->back()->with('success', 'Catatan konseling bimbingan berhasil disimpan.');
    }
}
