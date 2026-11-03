<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassEnrollment;
use App\Models\CourseMapping;
use App\Models\EwsBotSession;
use App\Models\EwsCounselingJournal;
use App\Models\EwsCourseAlert;
use App\Models\EwsNotification;
use App\Models\EwsStudentSummary;
use App\Models\EwsTelegramRecipient;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                ]
            );
            // status tindak lanjut guru (remedial/selesai) tidak boleh di-reset oleh run pipeline berikutnya

            // Jika payload menyertakan wa_message hasil LLM Qwen
            if (!empty($item['wa_message']) && in_array($alert->tingkat_risiko, ['TINGGI', 'SEDANG'])) {
                $guruName = $alert->guru_pengampu;
                $courseMapping = CourseMapping::where('code_module', $alert->kode_modul)->first();
                $phone = $item['no_wa_guru'] ?? $courseMapping?->no_wa_guru ?? null;
                $guruUser = User::where('name', $guruName)->first();
                if (!$phone && $guruUser) {
                    $phone = $guruUser->phone;
                }
                $phone = $phone ?? '-';

                $existingNotif = EwsNotification::where('alert_id', $alert->id)
                    ->where('status', 'pending')
                    ->first();

                if (!$existingNotif) {
                    EwsNotification::create([
                        'target_user_id' => $guruUser?->id,
                        'alert_id' => $alert->id,
                        'recipient_type' => 'guru_mapel',
                        'recipient_name' => $guruName,
                        'recipient_phone' => $phone,
                        'risk_level' => $alert->tingkat_risiko,
                        'message_type' => 'ai_generated',
                        'message_text' => $item['wa_message'],
                        'status' => 'pending',
                    ]);
                }
            }

            if ($alert->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }

        // Simpan juga Class Digest per Guru jika dikirimkan oleh Python
        $digests = $payload['digests'] ?? $payload['tier1_digests'] ?? [];
        $digestsQueued = 0;
        foreach ($digests as $digest) {
            if (empty($digest['wa_message'])) continue;
            $guruName = $digest['guru_pengampu'] ?? 'Guru Mata Pelajaran';
            $mapelName = $digest['nama_mapel'] ?? '';
            $courseMapping = CourseMapping::where('nama_guru_mapel', $guruName)
                ->orWhere('nama_mapel', $mapelName)->first();
            $phone = $digest['no_wa_guru'] ?? $courseMapping?->no_wa_guru ?? null;
            $guruUser = User::where('name', $guruName)->first();
            if (!$phone && $guruUser) {
                $phone = $guruUser->phone;
            }
            $phone = $phone ?? '-';

            EwsNotification::create([
                'target_user_id' => $guruUser?->id,
                'recipient_type' => 'guru_mapel',
                'recipient_name' => $guruName,
                'recipient_phone' => $phone,
                'risk_level' => $digest['risk_level'] ?? 'TINGGI',
                'message_type' => 'ai_generated',
                'message_text' => $digest['wa_message'],
                'status' => 'pending',
            ]);
            $digestsQueued++;
        }

        return response()->json([
            'success' => true,
            'message' => "Tier 1 Alerts berhasil diproses: {$created} baru, {$updated} diperbarui. Antrean WA: {$digestsQueued} digest.",
            'counts' => ['created' => $created, 'updated' => $updated, 'digests' => $digestsQueued],
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
                ]
            );
            // status penanganan BK hanya ditentukan saat pertama dibuat, setelah itu milik Guru BK
            if ($summary->wasRecentlyCreated && ($item['prioritas_konseling'] ?? null) === 'TINGGI') {
                $summary->update(['status_penanganan' => 'in_counseling']);
            }

            // Jika payload menyertakan wa_message hasil LLM Qwen untuk Guru BK
            if (!empty($item['wa_message']) && in_array($summary->prioritas_konseling, ['TINGGI', 'SEDANG'])) {
                $bkUser = User::where('role', 'guru_bk')->orWhere('role', 'bk')->first();
                $phone = $item['no_wa_bk'] ?? $bkUser?->phone ?? '-';

                $existingNotif = EwsNotification::where('summary_id', $summary->id)
                    ->where('status', 'pending')
                    ->first();

                if (!$existingNotif) {
                    EwsNotification::create([
                        'target_user_id' => $bkUser?->id,
                        'summary_id' => $summary->id,
                        'recipient_type' => 'guru_bk',
                        'recipient_name' => $bkUser?->name ?? 'Guru Bimbingan Konseling',
                        'recipient_phone' => $phone,
                        'risk_level' => $summary->prioritas_konseling,
                        'message_type' => 'ai_generated',
                        'message_text' => $item['wa_message'],
                        'status' => 'pending',
                    ]);
                }
            }

            if ($summary->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }

        // Simpan juga Digest BK jika dikirimkan oleh Python
        $bkDigests = $payload['bk_digests'] ?? $payload['tier2_digests'] ?? [];
        $bkQueued = 0;
        foreach ($bkDigests as $digest) {
            if (empty($digest['wa_message'])) continue;
            $bkUser = User::where('role', 'guru_bk')->orWhere('role', 'bk')->first();
            $phone = $digest['no_wa_bk'] ?? $bkUser?->phone ?? '-';

            EwsNotification::create([
                'target_user_id' => $bkUser?->id,
                'recipient_type' => 'guru_bk',
                'recipient_name' => $bkUser?->name ?? 'Guru Bimbingan Konseling',
                'recipient_phone' => $phone,
                'risk_level' => $digest['risk_level'] ?? 'TINGGI',
                'message_type' => 'ai_generated',
                'message_text' => $digest['wa_message'],
                'status' => 'pending',
            ]);
            $bkQueued++;
        }

        return response()->json([
            'success' => true,
            'message' => "Tier 2 Summaries berhasil diproses: {$created} baru, {$updated} diperbarui. Antrean WA BK: {$bkQueued}.",
            'counts' => ['created' => $created, 'updated' => $updated, 'bk_digests' => $bkQueued],
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

    /**
     * GET /api/ews/notifications/pending
     * Mengambil antrean pesan pending secara atomik untuk dikirim oleh Bot Baileys.
     * Menggunakan DB transaction + lockForUpdate sehingga aman dari race condition multi-gateway.
     */
    public function getPendingNotifications(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 10), 50);
        // Hanya klaim pesan untuk penerima yang sudah menautkan Telegram; sisanya tetap pending
        $chatIds = EwsTelegramRecipient::whereNotNull('chat_id')->pluck('chat_id', 'recipient_name');

        $claimed = DB::transaction(function () use ($limit, $chatIds) {
            $ids = EwsNotification::where('status', 'pending')
                ->whereIn('recipient_name', $chatIds->keys())
                ->where(fn ($q) => $q->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now()))
                ->orderBy('scheduled_at', 'asc')
                ->limit($limit)
                ->lockForUpdate()
                ->pluck('id');

            if ($ids->isEmpty()) {
                return collect();
            }

            EwsNotification::whereIn('id', $ids)
                ->update([
                    'status' => 'sending',
                    'sending_at' => now(),
                ]);

            return EwsNotification::whereIn('id', $ids)->get()
                ->each(fn ($n) => $n->setAttribute('telegram_chat_id', $chatIds[$n->recipient_name]));
        });

        return response()->json([
            'success' => true,
            'count' => $claimed->count(),
            'data' => $claimed,
        ]);
    }

    /**
     * PATCH /api/ews/notifications/{id}/status
     * Bot Baileys mengupdate status pengiriman (sent / failed).
     */
    public function updateNotificationStatus(Request $request, int $id): JsonResponse
    {
        $notification = EwsNotification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => "Notifikasi ID {$id} tidak ditemukan.",
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,sending,sent,failed',
            'error_message' => 'nullable|string',
        ]);

        $notification->status = $validated['status'];

        if ($validated['status'] === 'sending') {
            $notification->sending_at = now();
        } elseif ($validated['status'] === 'sent') {
            $notification->sent_at = now();
            $notification->sending_at = null;
            $notification->error_message = null;
        } elseif ($validated['status'] === 'failed') {
            $notification->sending_at = null;
            $notification->error_message = $validated['error_message'] ?? 'Gagal dikirim via WhatsApp.';
            $notification->retry_count += 1;
        } elseif ($validated['status'] === 'pending') {
            $notification->sending_at = null;
        }

        $notification->save();

        return response()->json([
            'success' => true,
            'message' => "Status notifikasi {$id} berhasil diperbarui menjadi {$notification->status}.",
            'data' => $notification,
        ]);
    }

    /**
     * POST /api/ews/telegram/link
     * Worker Telegram meneruskan perintah "/start <token>" dari guru untuk menautkan chat_id.
     */
    public function linkTelegram(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string|max:64',
            'chat_id' => 'required|string|max:32',
            'username' => 'nullable|string|max:64',
        ]);

        $recipient = EwsTelegramRecipient::where('link_token', $validated['token'])->first();
        if (!$recipient) {
            return response()->json(['success' => false, 'message' => 'Link tidak valid atau sudah diganti.'], 404);
        }

        $recipient->update([
            'chat_id' => $validated['chat_id'],
            'telegram_username' => $validated['username'] ?? null,
            'linked_at' => now(),
        ]);

        return response()->json(['success' => true, 'recipient_name' => $recipient->recipient_name]);
    }

    /**
     * POST /api/ews/bot/heartbeat
     * Bot Baileys melapor status koneksi (connected / qr_ready / disconnected).
     */
    public function recordBotHeartbeat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_name' => 'nullable|string|max:50',
            'status' => 'required|in:connected,qr_ready,disconnected',
            'phone_number' => 'nullable|string|max:50',
            'qr_code_payload' => 'nullable|string',
        ]);

        $sessionName = $validated['session_name'] ?? 'primary_ews_bot';

        $session = EwsBotSession::updateOrCreate(
            ['session_name' => $sessionName],
            [
                'status' => $validated['status'],
                'phone_number' => $validated['phone_number'] ?? null,
                'qr_code_payload' => $validated['qr_code_payload'] ?? null,
                'last_heartbeat_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat bot berhasil dicatat.',
            'is_online' => $session->isOnline(),
            'session' => $session,
        ]);
    }

    /**
     * GET /api/ews/bot/status
     * Mengambil status bot WA terkini untuk dipantau Admin.
     */
    public function getBotStatus(): JsonResponse
    {
        $session = EwsBotSession::where('session_name', 'primary_ews_bot')->first();

        return response()->json([
            'success' => true,
            'status' => $session?->status ?? 'disconnected',
            'is_online' => $session?->isOnline() ?? false,
            'phone_number' => $session?->phone_number,
            'qr_code_payload' => $session?->qr_code_payload,
            'last_heartbeat_at' => $session?->last_heartbeat_at?->diffForHumans() ?? 'Belum ada detak',
        ]);
    }
}
