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
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // Bagi Guru BK, seluruh fungsi Tier 2 sudah terintegrasi penuh di Dashboard BK
        if ($user && $user->role === 'guru_bk') {
            return redirect()->route('guru-bk.dashboard');
        }

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
        $studentSummaries = EwsStudentSummary::with([
            'student.classes' => fn ($q) => $q->wherePivot('is_current', true),
            'counselingJournals.counselor',
        ])
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
            'status_penanganan' => 'nullable|in:open,in_counseling,resolved',
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

        $newStatus = $request->input('status_penanganan', 'in_counseling');
        $summary = EwsStudentSummary::findOrFail($validated['summary_id']);
        $summary->update(['status_penanganan' => $newStatus]);

        // Feedback loop kolaboratif: Jika kasus ditandai 'resolved', sinkronkan alert rujukan guru mapel
        if ($newStatus === 'resolved') {
            $referredAlerts = EwsCourseAlert::where('siswa_id', $summary->siswa_id)
                ->where('catatan_guru_mapel', 'like', '%[DIRUJUK KE BK%')
                ->get();

            foreach ($referredAlerts as $alert) {
                $alert->status = 'selesai';
                $alert->catatan_guru_mapel = "[SELESAI DITANGANI GURU BK]: " . $alert->catatan_guru_mapel;
                $alert->save();
            }
        }

        return redirect()->back()->with('success', 'Catatan konseling bimbingan berhasil disimpan.');
    }

    /**
     * Rujuk / Eskalasi Siswa dari Guru Mapel ke Guru BK (Tier 1 -> Tier 2)
     */
    public function escalateToBk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'alert_id' => 'required|exists:ews_course_alerts,id',
            'catatan_rujukan' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        $alert = EwsCourseAlert::with('student')->findOrFail($validated['alert_id']);

        // 1. Update catatan guru mapel di alert Tier 1
        $prefix = "[DIRUJUK KE BK oleh " . ($user->name ?? 'Guru Mapel') . "]: ";
        $alert->update([
            'catatan_guru_mapel' => $prefix . $validated['catatan_rujukan'],
            'status' => 'konfirmasi_tugas',
        ]);

        // 2. Sinkronkan ke rincian_per_mata_pelajaran di Tier 2 (EwsStudentSummary)
        $summary = EwsStudentSummary::where('siswa_id', $alert->siswa_id)->first();
        if ($summary) {
            $rincian = $summary->rincian_per_mata_pelajaran ?? [];
            foreach ($rincian as &$item) {
                if (($item['kode_modul'] ?? '') === $alert->kode_modul) {
                    $item['status_rujukan'] = 'dirujuk_ke_bk';
                    $item['guru_perujuk'] = $user->name ?? 'Guru Mapel';
                    $item['catatan_rujukan'] = $validated['catatan_rujukan'];
                    $item['tanggal_rujukan'] = now()->toDateString();
                }
            }
            $summary->rincian_per_mata_pelajaran = $rincian;
            // Pastikan status penanganan terbuka kembali agar Guru BK terpicu
            if ($summary->status_penanganan === 'resolved') {
                $summary->status_penanganan = 'open';
            }
            $summary->save();
        }

        $studentName = $alert->student?->name ?? 'Siswa';
        return redirect()->back()->with('success', "Kasus {$studentName} pada mapel {$alert->nama_mapel} berhasil dirujuk ke Guru BK.");
    }
}
