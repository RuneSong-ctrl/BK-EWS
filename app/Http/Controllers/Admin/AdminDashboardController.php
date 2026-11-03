<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseMapping;
use App\Models\EwsBotSession;
use App\Models\EwsCourseAlert;
use App\Models\EwsNotification;
use App\Models\EwsStudentSummary;
use App\Models\EwsTelegramRecipient;
use App\Models\MoodleSyncLog;
use App\Models\User;
use App\Services\Ai\AiNotificationGeneratorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $lastSync = MoodleSyncLog::with('user')->latest()->first();
        $totalCourses = CourseMapping::count();
        $totalSummaries = EwsStudentSummary::count();
        $highRiskCount = EwsStudentSummary::where('prioritas_konseling', 'TINGGI')->count();
        $mediumRiskCount = EwsStudentSummary::where('prioritas_konseling', 'SEDANG')->count();
        $lowRiskCount = EwsStudentSummary::where('prioritas_konseling', 'RENDAH')->count();

        $courseMappings = CourseMapping::orderBy('code_module')->get();
        $syncLogs = MoodleSyncLog::with('user')->latest()->take(10)->get();

        // Data Bot WA & Antrean Notifikasi
        $botSession = EwsBotSession::where('session_name', 'primary_ews_bot')->first();
        $notifTotal = EwsNotification::count();
        $notifSent = EwsNotification::where('status', 'sent')->count();
        $notifPending = EwsNotification::where('status', 'pending')->count();
        $notifFailed = EwsNotification::where('status', 'failed')->count();

        $recentNotifications = EwsNotification::latest('created_at')
            ->take(30)
            ->get();

        return Inertia::render('Dashboard/Admin', [
            'kpi' => [
                'moodle_status' => 'connected',
                'moodle_url' => config('services.moodle.url', 'https://moodle.sekolah.sch.id'),
                'last_sync_at' => $lastSync?->created_at?->diffForHumans() ?? 'Belum pernah',
                'last_sync_full' => $lastSync?->created_at?->format('d M Y, H:i') ?? '-',
                'total_courses' => $totalCourses,
                'total_students' => $totalSummaries,
                'high_risk_count' => $highRiskCount,
                'medium_risk_count' => $mediumRiskCount,
                'low_risk_count' => $lowRiskCount,
            ],
            'botKpi' => [
                'status' => $botSession?->status ?? 'disconnected',
                'is_online' => $botSession?->isOnline() ?? false,
                'phone_number' => $botSession?->phone_number,
                'last_heartbeat' => $botSession?->last_heartbeat_at?->diffForHumans() ?? 'Belum ada detak',
                'total_notif' => $notifTotal,
                'sent_notif' => $notifSent,
                'pending_notif' => $notifPending,
                'failed_notif' => $notifFailed,
            ],
            'courseMappings' => $courseMappings,
            'syncLogs' => $syncLogs,
            'notifications' => $recentNotifications,
            'telegramRecipients' => EwsTelegramRecipient::orderByRaw('chat_id is null')->orderBy('recipient_name')
                ->get(['recipient_name', 'chat_id', 'telegram_username'])
                ->map(fn ($r) => ['name' => $r->recipient_name, 'linked' => $r->chat_id !== null, 'username' => $r->telegram_username]),
        ]);
    }

    /**
     * POST /admin/notifications/force-push
     * Reset seluruh notifikasi gagal/pending dan generate notifikasi untuk alert baru yang belum punya antrean
     */
    public function forcePush(Request $request, AiNotificationGeneratorService $generator): RedirectResponse
    {
        // 1. Reset yang failed ke pending
        $resetCount = EwsNotification::where('status', 'failed')->update([
            'status' => 'pending',
            'scheduled_at' => now(),
            'error_message' => null,
        ]);

        // 2. Generate notifikasi untuk alert Tier 1 berisiko TINGGI yang belum punya notifikasi
        $generatedCount = 0;
        $unnotifiedAlerts = EwsCourseAlert::where('tingkat_risiko', 'TINGGI')
            ->whereDoesntHave('notifications')
            ->take(10)
            ->get();

        foreach ($unnotifiedAlerts as $alert) {
            $generator->createNotificationForTier1($alert);
            $generatedCount++;
        }

        // 3. Generate notifikasi untuk summary Tier 2 berisiko TINGGI yang belum punya notifikasi
        $unnotifiedSummaries = EwsStudentSummary::where('prioritas_konseling', 'TINGGI')
            ->whereDoesntHave('notifications')
            ->take(5)
            ->get();

        foreach ($unnotifiedSummaries as $summary) {
            $generator->createNotificationForTier2($summary);
            $generatedCount++;
        }

        return back()->with('success', "Force Push berhasil: {$resetCount} notifikasi gagal direset, {$generatedCount} notifikasi baru dibuat ke antrean.");
    }

    /**
     * POST /admin/notifications/{id}/retry
     * Reset status satu notifikasi menjadi pending
     */
    public function retryNotification(int $id): RedirectResponse
    {
        $notification = EwsNotification::findOrFail($id);
        $notification->status = 'pending';
        $notification->scheduled_at = now();
        $notification->error_message = null;
        $notification->save();

        return back()->with('success', "Notifikasi ID #{$id} berhasil dijadwalkan ulang ke antrean.");
    }

    /**
     * POST /admin/notifications/test-send
     * Kirim notifikasi uji coba ke nomor WhatsApp tertentu
     */
    public function testSend(Request $request, AiNotificationGeneratorService $generator): RedirectResponse
    {
        $validated = $request->validate([
            'recipient_type' => 'required|in:guru_mapel,guru_bk',
            // Telegram dikirim ke chat yang sudah tertaut, dipilih per nama penerima
            'recipient_name' => 'required|string|exists:ews_telegram_recipients,recipient_name',
            'sample_alert_id' => 'nullable|exists:ews_course_alerts,id',
            'sample_summary_id' => 'nullable|exists:ews_student_summaries,id',
        ]);

        $messageText = '';
        $recipientName = '';
        $alertId = null;
        $summaryId = null;

        if ($validated['recipient_type'] === 'guru_mapel') {
            $alert = !empty($validated['sample_alert_id'])
                ? EwsCourseAlert::find($validated['sample_alert_id'])
                // Utamakan alert milik guru yang dipilih agar sapaan & isinya sesuai penerima
                : (EwsCourseAlert::where('guru_pengampu', $validated['recipient_name'])->latest()->first()
                    ?? EwsCourseAlert::latest()->first());

            $messageText = $alert
                ? $generator->generateTier1Message($alert)
                : "📢 *[EWS ALERT TIER 1 - UJI COBA]*\n\nIni adalah pesan uji coba sistem gateway WhatsApp SMKN 1 MAS untuk Guru Mata Pelajaran.";
            $alertId = $alert?->id;
        } else {
            $summary = !empty($validated['sample_summary_id'])
                ? EwsStudentSummary::find($validated['sample_summary_id'])
                : EwsStudentSummary::latest()->first();

            $messageText = $summary
                ? $generator->generateTier2Message($summary)
                : "🛡️ *[TRIAGE EWS TIER 2 - UJI COBA]*\n\nIni adalah pesan uji coba sistem gateway WhatsApp SMKN 1 MAS untuk Konselor Guru BK.";
            $summaryId = $summary?->id;
        }

        $recipientName = $validated['recipient_name'];
        $sampleOwner = $alert->guru_pengampu ?? null;
        if (isset($alert) && $sampleOwner !== $recipientName) {
            // Contoh data milik guru lain: tandai jelas supaya penerima tidak mengira itu siswanya
            $messageText = "🧪 *UJI COBA* untuk {$recipientName} (contoh data milik {$sampleOwner})\n\n" . $messageText;
        }

        EwsNotification::create([
            'alert_id' => $alertId,
            'summary_id' => $summaryId,
            'recipient_type' => $validated['recipient_type'],
            'recipient_name' => $recipientName,
            'recipient_phone' => '-',
            'risk_level' => 'TINGGI',
            'message_type' => 'ai_generated',
            'message_text' => $messageText,
            'status' => 'pending',
            'scheduled_at' => now(),
        ]);

        return back()->with('success', "Pesan uji coba masuk antrean Telegram untuk {$recipientName}.");
    }
}
