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
use App\Services\Ews\EwsIngestionService;
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
    public function storeTier1Alerts(Request $request, EwsIngestionService $ingestion): JsonResponse
    {
        $payload = $request->all();
        $items = $payload['tier1_subject_teacher'] ?? (isset($payload[0]) ? $payload : [$payload]);
        $counts = $ingestion->ingestTier1($items);

        // Jika payload menyertakan wa_message hasil LLM Qwen untuk alert individu
        foreach ($items as $item) {
            if (empty($item['wa_message']) || !in_array($item['analisis_risiko']['tingkat_risiko'] ?? '', ['TINGGI', 'SEDANG'])) {
                continue;
            }

            $idSiswa = $item['id_siswa'] ?? null;
            if (!$idSiswa) continue;

            $student = Student::where('nis', (string) $idSiswa)->first();
            if (!$student) continue;

            $alert = EwsCourseAlert::where('siswa_id', $student->id)
                ->where('kode_modul', $item['mata_pelajaran']['kode_modul'] ?? 'AAA')
                ->first();

            if (!$alert) continue;

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
            'message' => "Tier 1 Alerts berhasil diproses: {$counts['created']} baru, {$counts['updated']} diperbarui. Antrean WA: {$digestsQueued} digest.",
            'counts' => array_merge($counts, ['digests' => $digestsQueued]),
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

        // Jika payload menyertakan wa_message hasil LLM Qwen untuk Guru BK
        foreach ($items as $item) {
            if (empty($item['wa_message']) || !in_array($item['prioritas_konseling'] ?? '', ['TINGGI', 'SEDANG'])) {
                continue;
            }

            $idSiswa = $item['id_siswa'] ?? null;
            if (!$idSiswa) continue;

            $student = Student::where('nis', (string) $idSiswa)->first();
            if (!$student) continue;

            $summary = EwsStudentSummary::where('siswa_id', $student->id)->first();
            if (!$summary) continue;

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
            'message' => "Tier 2 Summaries berhasil diproses: {$counts['created']} baru, {$counts['updated']} diperbarui. Antrean WA BK: {$bkQueued}.",
            'counts' => array_merge($counts, ['bk_digests' => $bkQueued]),
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
