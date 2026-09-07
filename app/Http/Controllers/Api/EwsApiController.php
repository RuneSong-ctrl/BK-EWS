<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EwsIntervention;
use App\Models\EwsNotification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EwsApiController extends Controller
{
    /**
     * GET /api/ews/notifications
     * Mengambil daftar notifikasi EWS berfilter dan statistik ringkasan
     */
    public function index(Request $request): JsonResponse
    {
        $query = EwsNotification::with(['student', 'interventions.counselor']);

        // Filter: Tingkat Risiko (TINGGI, SEDANG, RENDAH)
        if ($request->filled('risk_level')) {
            $query->where('risk_level', strtoupper($request->query('risk_level')));
        }

        // Filter: Status Notifikasi (pending, ready, sent, failed)
        if ($request->filled('status')) {
            $query->where('status', strtolower($request->query('status')));
        }

        // Filter: Periode Akademik
        if ($request->filled('academic_period')) {
            $query->where('academic_period', $request->query('academic_period'));
        }

        // Search: Nama Siswa atau ID Moodle
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('student_name', 'like', "%{$search}%")
                  ->orWhere('moodle_student_id', 'like', "%{$search}%")
                  ->orWhere('class_name', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->query('sort_by', 'risk_probability');
        $sortOrder = $request->query('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->query('per_page', 15);
        $notifications = $query->paginate($perPage);

        // Ringkasan Statistik
        $stats = [
            'total' => EwsNotification::count(),
            'tinggi_count' => EwsNotification::where('risk_level', 'TINGGI')->count(),
            'sedang_count' => EwsNotification::where('risk_level', 'SEDANG')->count(),
            'rendah_count' => EwsNotification::where('risk_level', 'RENDAH')->count(),
            'sent_count' => EwsNotification::where('status', 'sent')->count(),
            'pending_count' => EwsNotification::whereIn('status', ['pending', 'ready'])->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'data' => $notifications,
        ]);
    }

    /**
     * GET /api/ews/notifications/{id}
     * Menampilkan detail lengkap 1 notifikasi EWS beserta intervensinya
     */
    public function show(int $id): JsonResponse
    {
        $notification = EwsNotification::with(['student', 'targetUser', 'interventions.counselor', 'interventions.bkCase'])
            ->find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi EWS tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    /**
     * POST /api/ews/notifications
     * Menerima payload batch/single hasil deteksi model Moodle & prompt SLM
     */
    public function store(Request $request): JsonResponse
    {
        $items = $request->has('notifications') ? $request->input('notifications') : [$request->all()];

        if (empty($items) || !is_array($items)) {
            return response()->json([
                'success' => false,
                'message' => 'Payload notifikasi tidak valid.',
            ], 422);
        }

        // Default Guru BK sebagai target
        $defaultCounselor = User::where('role', 'guru_bk')->first();
        $savedCount = 0;
        $savedIds = [];

        foreach ($items as $item) {
            $validator = Validator::make($item, [
                'moodle_student_id' => 'required',
                'student_name' => 'required|string',
                'course_code' => 'required|string',
                'academic_period' => 'required|string',
                'risk_level' => 'required|in:TINGGI,SEDANG,RENDAH,tinggi,sedang,rendah',
                'risk_probability' => 'required|numeric',
                'moodle_metrics' => 'required',
                'risk_factors' => 'required',
            ]);

            if ($validator->fails()) {
                continue;
            }

            // Cari keterkaitan dengan siswa lokal jika ada (via NIS atau nama)
            $studentId = $item['student_id'] ?? null;
            if (!$studentId && !empty($item['nis'])) {
                $studentId = Student::where('nis', $item['nis'])->value('id');
            }
            if (!$studentId && !empty($item['student_name'])) {
                $studentId = Student::where('name', $item['student_name'])->value('id');
            }

            $riskLevel = strtoupper($item['risk_level']);
            $riskProb = (float) $item['risk_probability'];
            $riskPercent = $item['risk_percentage'] ?? (round($riskProb * 100, 1) . '%');

            $notification = EwsNotification::updateOrCreate(
                [
                    'moodle_student_id' => (string) $item['moodle_student_id'],
                    'course_code' => $item['course_code'],
                    'academic_period' => $item['academic_period'],
                ],
                [
                    'student_id' => $studentId,
                    'student_name' => $item['student_name'],
                    'class_name' => $item['class_name'] ?? null,
                    'risk_level' => $riskLevel,
                    'risk_probability' => $riskProb,
                    'risk_percentage' => $riskPercent,
                    'decision_threshold' => $item['decision_threshold'] ?? 0.40,
                    'intervention_urgency' => $item['intervention_urgency'] ?? null,
                    'moodle_metrics' => is_array($item['moodle_metrics']) ? $item['moodle_metrics'] : json_decode($item['moodle_metrics'], true),
                    'risk_factors' => is_array($item['risk_factors']) ? $item['risk_factors'] : json_decode($item['risk_factors'], true),
                    'ai_narration' => $item['ai_narration'] ?? null,
                    'wa_message' => $item['wa_message'] ?? null,
                    'audience' => $item['audience'] ?? 'guru_bk',
                    'target_user_id' => $item['target_user_id'] ?? $defaultCounselor?->id,
                    'target_phone' => $item['target_phone'] ?? null,
                    'status' => $item['status'] ?? 'pending',
                ]
            );

            $savedCount++;
            $savedIds[] = $notification->id;
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil memproses {$savedCount} notifikasi EWS.",
            'saved_ids' => $savedIds,
        ]);
    }

    /**
     * PATCH /api/ews/notifications/{id}/status
     * Memperbarui status pengiriman WA oleh worker Baileys
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $notification = EwsNotification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,generating,ready,sent,failed',
            'error_message' => 'nullable|string',
            'sent_at' => 'nullable|date',
        ]);

        $notification->status = $validated['status'];
        if (isset($validated['error_message'])) {
            $notification->error_message = $validated['error_message'];
        }
        if ($validated['status'] === 'sent') {
            $notification->sent_at = $validated['sent_at'] ?? now();
        }

        $notification->save();

        return response()->json([
            'success' => true,
            'message' => "Status notifikasi berhasil diperbarui menjadi {$validated['status']}.",
            'data' => $notification,
        ]);
    }

    /**
     * POST /api/ews/interventions
     * Mencatat tindakan intervensi konseling oleh Guru BK
     */
    public function storeIntervention(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notification_id' => 'required|exists:ews_notifications,id',
            'intervention_type' => 'required|in:KONSELING_INDIVIDU,PEMANGGILAN,KONFIRMASI_WALI,HOME_VISIT,LAINNYA',
            'action_notes' => 'required|string|min:5',
            'student_progress' => 'nullable|in:MEMBAIK,TETAP,MEMBURUK,DALAM_PEMANTAUAN',
            'follow_up_date' => 'nullable|date',
            'counselor_id' => 'nullable|exists:users,id',
            'bk_case_id' => 'nullable|exists:bk_cases,id',
        ]);

        $counselorId = $validated['counselor_id'] ?? auth()->id() ?? User::where('role', 'guru_bk')->value('id');

        $intervention = EwsIntervention::create([
            'notification_id' => $validated['notification_id'],
            'counselor_id' => $counselorId,
            'bk_case_id' => $validated['bk_case_id'] ?? null,
            'intervention_type' => $validated['intervention_type'],
            'action_notes' => $validated['action_notes'],
            'student_progress' => $validated['student_progress'] ?? 'DALAM_PEMANTAUAN',
            'follow_up_date' => $validated['follow_up_date'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Intervensi konseling berhasil dicatat.',
            'data' => $intervention->load(['counselor', 'notification']),
        ], 201);
    }
}
