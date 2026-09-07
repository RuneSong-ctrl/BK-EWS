<?php

namespace App\Http\Controllers;

use App\Models\EwsIntervention;
use App\Models\EwsNotification;
use App\Models\SchoolClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EwsMonitoringController extends Controller
{
    /**
     * Tampilkan Halaman Monitoring EWS Moodle & Notifikasi AI
     * Mendukung auto-scoping data untuk Guru BK (seluruh sekolah) dan Guru Kelas (hanya rombelnya).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $homeroomClass = null;

        if ($user->role === 'guru_kelas') {
            $homeroomClass = SchoolClass::where('homeroom_teacher_id', $user->id)->first();
        }

        $query = EwsNotification::with([
            'student',
            'targetUser',
            'interventions.counselor',
        ]);

        // Auto-Scoping: Jika Wali Kelas, batasi hanya murid di kelas binaannya
        if ($user->role === 'guru_kelas') {
            if ($homeroomClass) {
                $query->where(function ($q) use ($homeroomClass) {
                    $q->whereHas('student.enrollments', function ($sub) use ($homeroomClass) {
                        $sub->where('class_id', $homeroomClass->id)->where('is_current', true);
                    })->orWhere('class_name', $homeroomClass->name);
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($request->filled('class_id') && $request->query('class_id') !== 'ALL') {
            $classId = $request->query('class_id');
            $selectedClass = SchoolClass::find($classId);
            if ($selectedClass) {
                $query->where(function ($q) use ($selectedClass) {
                    $q->whereHas('student.enrollments', function ($sub) use ($selectedClass) {
                        $sub->where('class_id', $selectedClass->id)->where('is_current', true);
                    })->orWhere('class_name', $selectedClass->name);
                });
            }
        }

        // Filter: Tingkat Risiko
        if ($request->filled('risk_level') && $request->query('risk_level') !== 'ALL') {
            $query->where('risk_level', strtoupper($request->query('risk_level')));
        }

        // Filter: Status Notifikasi WA
        if ($request->filled('status') && $request->query('status') !== 'ALL') {
            $query->where('status', strtolower($request->query('status')));
        }

        // Search: Nama Siswa, ID Moodle, atau Kelas
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('student_name', 'like', "%{$search}%")
                  ->orWhere('moodle_student_id', 'like', "%{$search}%")
                  ->orWhere('class_name', 'like', "%{$search}%");
            });
        }

        $notifications = $query->orderBy('risk_probability', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Hitung statistik kontekstual sesuai scope peran
        $statsBase = EwsNotification::query();
        if ($user->role === 'guru_kelas' && $homeroomClass) {
            $statsBase->where(function ($q) use ($homeroomClass) {
                $q->whereHas('student.enrollments', function ($sub) use ($homeroomClass) {
                    $sub->where('class_id', $homeroomClass->id)->where('is_current', true);
                })->orWhere('class_name', $homeroomClass->name);
            });
        }

        $stats = [
            'total' => (clone $statsBase)->count(),
            'tinggi_count' => (clone $statsBase)->where('risk_level', 'TINGGI')->count(),
            'sedang_count' => (clone $statsBase)->where('risk_level', 'SEDANG')->count(),
            'rendah_count' => (clone $statsBase)->where('risk_level', 'RENDAH')->count(),
            'wa_sent_count' => (clone $statsBase)->where('status', 'sent')->count(),
            'pending_count' => (clone $statsBase)->whereIn('status', ['pending', 'ready'])->count(),
        ];

        $classes = SchoolClass::orderBy('name')->get(['id', 'name', 'grade_level', 'academic_year']);

        return Inertia::render('Dashboard/EwsMonitoring', [
            'ewsNotifications' => $notifications,
            'stats' => $stats,
            'classes' => $classes,
            'homeroomClass' => $homeroomClass,
            'userRole' => $user->role,
            'filters' => [
                'risk_level' => $request->query('risk_level', 'ALL'),
                'status' => $request->query('status', 'ALL'),
                'search' => $request->query('search', ''),
                'class_id' => $request->query('class_id', 'ALL'),
            ],
        ]);
    }

    /**
     * Simpan catatan tindak lanjut intervensi konseling / pendampingan siswa
     */
    public function storeIntervention(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'notification_id' => 'required|exists:ews_notifications,id',
            'intervention_type' => 'required|string',
            'action_notes' => 'required|string|min:5',
            'student_progress' => 'nullable|string',
            'follow_up_date' => 'nullable|date',
            'bk_case_id' => 'nullable|exists:bk_cases,id',
        ]);

        EwsIntervention::create([
            'notification_id' => $validated['notification_id'],
            'counselor_id' => $request->user()->id,
            'bk_case_id' => $validated['bk_case_id'] ?? null,
            'intervention_type' => $validated['intervention_type'],
            'action_notes' => $validated['action_notes'],
            'student_progress' => $validated['student_progress'] ?? 'DALAM_PEMANTAUAN',
            'follow_up_date' => $validated['follow_up_date'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Catatan tindak lanjut berhasil disimpan.');
    }
}
