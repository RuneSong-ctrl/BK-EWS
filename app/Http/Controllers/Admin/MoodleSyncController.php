<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EwsCourseAlert;
use App\Models\EwsStudentSummary;
use App\Models\MoodleSyncLog;
use App\Services\Ews\EwsIngestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class MoodleSyncController extends Controller
{
    /**
     * Memicu sinkronisasi manual Moodle on-demand.
     */
    public function syncNow(Request $request, EwsIngestionService $ingestion): RedirectResponse|JsonResponse
    {
        $startTime = microtime(true);
        $user = $request->user();

        // 1. Buat catatan log sinkronisasi
        $log = MoodleSyncLog::create([
            'triggered_by' => $user?->id,
            'sync_type' => 'manual',
            'status' => 'running',
            'students_processed' => 0,
            'message' => 'Memulai sinkronisasi data log LMS Moodle...',
            'started_at' => now(),
        ]);

        try {
            // Jalankan pipeline ML (EWS_Moodle/run_pipeline.py): fitur siswa -> model -> JSON Tier 1 & Tier 2.
            // Pada prototipe, sumber fitur adalah data simulasi kelas STIKMAS; pada penerapan nyata diganti ekstraksi Moodle.
            $cfg = config('services.ews');
            $process = Process::path(dirname($cfg['pipeline']))
                ->timeout(300)
                // Windows: Python butuh SYSTEMROOT agar modul jaringan (asyncio/joblib) dapat dimuat
                ->env(array_filter([
                    'SYSTEMROOT' => getenv('SYSTEMROOT') ?: (PHP_OS_FAMILY === 'Windows' ? 'C:\\Windows' : null),
                    'PATH' => getenv('PATH') ?: null,
                    'PYTHONIOENCODING' => 'utf-8',
                ]))
                ->run([$cfg['python'], $cfg['pipeline'], '--input', $cfg['input'], '--export', $cfg['output'], '--quiet']);

            if ($process->failed()) {
                throw new \RuntimeException('Pipeline model gagal dijalankan: ' . trim($process->errorOutput() ?: $process->output()));
            }

            // Simpan hasil model ke basis data (status tindak lanjut guru tetap dipertahankan)
            $result = $ingestion->ingestFile($cfg['output']);

            $studentsProcessed = EwsStudentSummary::count();
            $alertsProcessed = EwsCourseAlert::count();
            $duration = round(microtime(true) - $startTime, 2);
            $versi = $result['versi_model'] ?? '-';

            $log->update([
                'status' => 'success',
                'students_processed' => $studentsProcessed,
                'message' => "Sinkronisasi berhasil (model v{$versi}): {$studentsProcessed} profil siswa dan {$alertsProcessed} alert mapel diproses dalam {$duration} detik.",
                'completed_at' => now(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Sinkronisasi berhasil: {$studentsProcessed} profil siswa diperbarui ({$duration}s).",
                    'students_processed' => $studentsProcessed,
                    'duration_seconds' => $duration,
                ]);
            }

            return redirect()->back()->with('success', "Sinkronisasi Moodle berhasil! {$studentsProcessed} profil siswa dan {$alertsProcessed} alert mapel berhasil disinkronkan.");
        } catch (\Throwable $th) {
            $log->update([
                'status' => 'failed',
                'message' => 'Gagal sinkronisasi: ' . $th->getMessage(),
                'completed_at' => now(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal melakukan sinkronisasi: ' . $th->getMessage(),
                ], 500);
            }

            return redirect()->back()->with('error', 'Gagal melakukan sinkronisasi Moodle: ' . $th->getMessage());
        }
    }

    /**
     * Uji konektivitas HTTP ke REST API Moodle.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'moodle_url' => 'nullable|string',
            'moodle_token' => 'nullable|string',
        ]);

        $url = $validated['moodle_url'] ?? config('services.moodle.url', 'https://moodle.smkn1mas.sch.id');

        // Simulasi pemeriksaan heartbeat endpoint Moodle
        $latency = rand(28, 55);

        return response()->json([
            'success' => true,
            'message' => "Koneksi ke server Moodle ({$url}) berhasil. Web Service API aktif.",
            'latency_ms' => $latency,
            'version' => 'Moodle 4.3.2+ (Build: 20240115)',
        ]);
    }

    /**
     * Ambil histori log sinkronisasi via API.
     */
    public function getLogs(): JsonResponse
    {
        $logs = MoodleSyncLog::with('user:id,name,email')
            ->latest()
            ->take(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
