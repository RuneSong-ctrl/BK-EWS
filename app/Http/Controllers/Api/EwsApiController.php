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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EwsApiController extends Controller
{
    /**
     * POST /api/ews/tier1/alerts
     * Ingestion batch/single payload Tier 1 (Guru Mapel) dari pipeline Python/Moodle.
     */
    public function storeTier1Alerts(Request $request): JsonResponse
    {
        $payload = $request->all();
        $items = isset($payload['tier1_subject_teacher']) ? $payload['tier1_subject_teacher'] : (is_array($payload) && isset($payload[0]) ? $payload : [$payload]);

        $created = 0;
        $updated = 0;

        foreach ($items as $item) {
            $idSiswa = $item['id_siswa'] ?? null;
            if (!$idSiswa) continue;

            $namaSiswa = $item['nama_siswa'] ?? "Siswa {$idSiswa}";
            $kelasNama = $item['kelas'] ?? 'X-RPL-1';

            $student = Student::firstOrCreate(
                ['nis' => (string) $idSiswa],
                [
                    'nisn' => '008' . str_pad($idSiswa, 7, '0', STR_PAD_LEFT),
                    'name' => $namaSiswa,
                    'gender' => 'L',
                    'status' => 'AKTIF',
                ]
            );

            $m24 = $item['metrik_24_fitur_model'] ?? [];

            $alert = EwsCourseAlert::updateOrCreate(
                [
                    'siswa_id' => $student->id,
                    'kode_modul' => $item['mata_pelajaran']['kode_modul'] ?? 'AAA',
                ],
                [
                    'nama_mapel' => $item['mata_pelajaran']['nama_mapel'] ?? 'Mata Pelajaran',
                    'kategori_mapel' => $item['mata_pelajaran']['kategori'] ?? 'Kejuruan/Produktif',
                    'guru_pengampu' => $item['mata_pelajaran']['guru_pengampu'] ?? 'Guru Mapel',
                    'kkm' => (int) ($item['mata_pelajaran']['kkm'] ?? 75),
                    'tingkat_risiko' => $item['analisis_risiko']['tingkat_risiko'] ?? 'RENDAH',
                    'probabilitas_risiko' => (float) ($item['analisis_risiko']['probabilitas_risiko'] ?? 0.0),
                    'durasi_belajar_jam' => (float) ($m24['engagement_dan_durasi']['course_duration_hours'] ?? 0.0),
                    'lesson_attempts' => (int) ($m24['aktivitas_lesson']['lesson_attempts_count'] ?? 0),
                    'rasio_ketuntasan_lesson' => (float) ($m24['aktivitas_lesson']['lesson_completion_ratio'] ?? 0.0),
                    'nilai_rata_rata_lesson' => (float) ($m24['aktivitas_lesson']['lesson_avg_score'] ?? 0.0),
                    'tugas_belum_dikumpul' => (int) ($m24['kepatuhan_tugas']['missing_assignments'] ?? 0),
                    'tugas_terlambat' => (int) ($m24['kepatuhan_tugas']['late_submission_count'] ?? 0),
                    'nilai_rata_rata_tugas' => (float) ($m24['akademik']['avg_score'] ?? 0.0),
                    'metrik_24_fitur_model' => $m24,
                    'faktor_pemicu' => $item['faktor_pemicu'] ?? [],
                    'rekomendasi_tindakan' => $item['rekomendasi_tindakan'] ?? '',
                    'status' => 'pending',
                ]
            );

            if ($alert->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Tier 1 Alerts berhasil diproses: {$created} baru, {$updated} diperbarui.",
            'counts' => ['created' => $created, 'updated' => $updated],
        ]);
    }

    /**
     * POST /api/ews/tier2/summaries
     * Ingestion batch/single payload Tier 2 (Guru BK) dari pipeline Python.
     */
    public function storeTier2Summaries(Request $request): JsonResponse
    {
        $payload = $request->all();
        $items = isset($payload['tier2_counselor_bk']) ? $payload['tier2_counselor_bk'] : (is_array($payload) && isset($payload[0]) ? $payload : [$payload]);

        $created = 0;
        $updated = 0;

        foreach ($items as $item) {
            $idSiswa = $item['id_siswa'] ?? null;
            if (!$idSiswa) continue;

            $student = Student::where('nis', (string) $idSiswa)->first();
            if (!$student) {
                $namaSiswa = $item['nama_siswa'] ?? "Siswa {$idSiswa}";
                $student = Student::create([
                    'nis' => (string) $idSiswa,
                    'nisn' => '008' . str_pad($idSiswa, 7, '0', STR_PAD_LEFT),
                    'name' => $namaSiswa,
                    'gender' => 'L',
                    'status' => 'AKTIF',
                ]);
            }

            $rekap = $item['rekapitulasi_semester'] ?? [];

            $summary = EwsStudentSummary::updateOrCreate(
                ['siswa_id' => $student->id],
                [
                    'total_mapel_diambil' => (int) ($rekap['total_mapel_diambil'] ?? 0),
                    'total_mapel_berisiko' => (int) ($rekap['total_mapel_berisiko'] ?? 0),
                    'total_jam_belajar' => (float) ($rekap['total_jam_belajar'] ?? 0.0),
                    'total_tugas_belum_dikumpul' => (int) ($rekap['total_tugas_belum_dikumpul'] ?? 0),
                    'total_tugas_terlambat' => (int) ($rekap['total_tugas_terlambat'] ?? 0),
                    'inaktivitas_terlama_hari' => (int) ($rekap['inaktivitas_terlama_hari'] ?? 0),
                    'profil_karakter_belajar' => $item['profil_karakter_belajar'] ?? 'Normal',
                    'prioritas_konseling' => $item['prioritas_konseling'] ?? 'RENDAH',
                    'rekomendasi_tindakan' => $item['rekomendasi_tindakan'] ?? '',
                    'rincian_per_mata_pelajaran' => $item['rincian_per_mata_pelajaran'] ?? [],
                    'status_penanganan' => ($item['prioritas_konseling'] === 'TINGGI') ? 'in_counseling' : 'open',
                ]
            );

            if ($summary->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Tier 2 Summaries berhasil diproses: {$created} baru, {$updated} diperbarui.",
            'counts' => ['created' => $created, 'updated' => $updated],
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
