<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassEnrollment;
use App\Models\CourseMapping;
use App\Models\EwsCounselingJournal;
use App\Models\EwsCourseAlert;
use App\Models\EwsStudentSummary;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use App\Services\Ews\EwsIngestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EwsApiController extends Controller
{
    /**
     * POST /api/ews/tier1/alerts
     * Ingestion batch/single payload Tier 1 (Guru Mapel) dari pipeline Python/Moodle.
     */
    public function storeTier1Alerts(Request $request, EwsIngestionService $ingestion): JsonResponse
    {
        $payload = $request->all();
        $items = $payload['tier1_subject_teacher'] ?? (isset($payload[0]) ? $payload : [$payload]);
        $counts = $ingestion->ingestTier1($items);

        return response()->json([
            'success' => true,
            'message' => "Tier 1 Alerts berhasil diproses: {$counts['created']} baru, {$counts['updated']} diperbarui.",
            'counts' => $counts,
        ]);
    }

    /**
     * POST /api/ews/tier2/summaries
     * Ingestion batch/single payload Tier 2 (Guru BK) dari pipeline Python.
     */
    public function storeTier2Summaries(Request $request, EwsIngestionService $ingestion): JsonResponse
    {
        $payload = $request->all();
        $items = $payload['tier2_counselor_bk'] ?? (isset($payload[0]) ? $payload : [$payload]);
        $counts = $ingestion->ingestTier2($items);

        return response()->json([
            'success' => true,
            'message' => "Tier 2 Summaries berhasil diproses: {$counts['created']} baru, {$counts['updated']} diperbarui.",
            'counts' => $counts,
        ]);
    }

    /**
     * GET /api/ews/teacher/my-courses
     * Mengambil daftar alert kursus untuk Guru Mata Pelajaran.
     */
    public function getTeacherAlerts(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = EwsCourseAlert::with('student');

        // Filter modul / mapel
        if ($request->filled('kode_modul')) {
            $query->where('kode_modul', $request->query('kode_modul'));
        }

        // Filter tingkat risiko
        if ($request->filled('tingkat_risiko')) {
            $query->where('tingkat_risiko', strtoupper($request->query('tingkat_risiko')));
        }

        // Filter status tindakan
        if ($request->filled('status')) {
            $query->where('status', strtolower($request->query('status')));
        }

        $alerts = $query->orderBy('probabilitas_risiko', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $alerts,
        ]);
    }

    /**
     * PATCH /api/ews/teacher/alerts/{id}/status
     * Memperbarui status intervensi guru mapel (konfirmasi_tugas, remedial, selesai).
     */
    public function updateAlertStatus(Request $request, int $id): JsonResponse
    {
        $alert = EwsCourseAlert::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,konfirmasi_tugas,remedial,selesai',
            'catatan_guru_mapel' => 'nullable|string',
        ]);

        $alert->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Status tindak lanjut guru mapel berhasil diperbarui.',
            'data' => $alert,
        ]);
    }

    /**
     * GET /api/ews/bk/triage
     * Mengambil daftar triage klinis untuk Guru BK terurut prioritas.
     */
    public function getBkTriage(Request $request): JsonResponse
    {
        $summaries = EwsStudentSummary::with(['student', 'counselingJournals.counselor'])
            ->orderByRaw("CASE 
                WHEN prioritas_konseling = 'TINGGI' THEN 1 
                WHEN prioritas_konseling = 'SEDANG' THEN 2 
                ELSE 3 END")
            ->orderBy('inaktivitas_terlama_hari', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $summaries,
            'stats' => [
                'total' => $summaries->count(),
                'tinggi' => $summaries->where('prioritas_konseling', 'TINGGI')->count(),
                'sedang' => $summaries->where('prioritas_konseling', 'SEDANG')->count(),
                'rendah' => $summaries->where('prioritas_konseling', 'RENDAH')->count(),
                'inaktif_kritis' => $summaries->where('inaktivitas_terlama_hari', '>', 14)->count(),
            ],
        ]);
    }

    /**
     * POST /api/ews/counseling/record
     * Menyimpan sesi jurnal bimbingan konseling Guru BK.
     */
    public function storeCounselingRecord(Request $request): JsonResponse
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
        $journal = EwsCounselingJournal::create([
            'summary_id' => $validated['summary_id'],
            'guru_bk_id' => $user ? $user->id : (User::where('role', 'guru_bk')->value('id') ?? 1),
            'jenis_layanan' => $validated['jenis_layanan'],
            'catatan_konseling' => $validated['catatan_konseling'],
            'rencana_tindak_lanjut' => $validated['rencana_tindak_lanjut'],
            'evaluasi_perilaku' => $validated['evaluasi_perilaku'] ?? null,
            'tanggal_monitoring_berikutnya' => $validated['tanggal_monitoring_berikutnya'] ?? null,
        ]);

        // Update status penanganan di student summary
        EwsStudentSummary::where('id', $validated['summary_id'])->update(['status_penanganan' => 'in_counseling']);

        return response()->json([
            'success' => true,
            'message' => 'Jurnal bimbingan konseling berhasil disimpan.',
            'data' => $journal,
        ]);
    }

    /**
     * GET /api/ews/kepsek/overview
     * Agregasi eksekutif untuk Kepala Sekolah.
     */
    public function getKepsekOverview(): JsonResponse
    {
        $totalStudents = EwsStudentSummary::count();
        $highRisk = EwsStudentSummary::where('prioritas_konseling', 'TINGGI')->count();
        $mediumRisk = EwsStudentSummary::where('prioritas_konseling', 'SEDANG')->count();
        $lowRisk = EwsStudentSummary::where('prioritas_konseling', 'RENDAH')->count();

        $totalAlerts = EwsCourseAlert::count();
        $handledAlerts = EwsCourseAlert::whereIn('status', ['konfirmasi_tugas', 'remedial', 'selesai'])->count();
        $coverageRate = $totalAlerts > 0 ? round(($handledAlerts / $totalAlerts) * 100, 1) : 0.0;

        return response()->json([
            'success' => true,
            'kpi' => [
                'total_students' => $totalStudents,
                'high_risk' => $highRisk,
                'medium_risk' => $mediumRisk,
                'low_risk' => $lowRisk,
                'total_alerts' => $totalAlerts,
                'handled_alerts' => $handledAlerts,
                'coverage_rate' => $coverageRate,
            ],
        ]);
    }
}
