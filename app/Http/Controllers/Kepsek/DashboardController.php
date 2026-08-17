<?php

namespace App\Http\Controllers\Kepsek;

use App\Http\Controllers\Controller;
use App\Models\AcademicRecord;
use App\Models\AttendanceRecord;
use App\Models\BehaviorObservation;
use App\Models\BkCase;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Audit\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $allStudents = Student::with([
            'ewsScore',
            'classes' => fn ($q) => $q->wherePivot('is_current', true),
            'academicRecords',
            'attendanceRecords' => fn ($q) => $q->where('date', '>=', Carbon::today()->subDays(30)),
            'behaviorObservations' => fn ($q) => $q->where('date', '>=', Carbon::today()->subDays(30)),
            'bkCases',
        ])->get();

        $stats = [
            'total_students' => $allStudents->count(),
            'normal_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'NORMAL')->count(),
            'berisiko_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'BERISIKO')->count(),
            'waspada_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'WASPADA')->count(),
            'kritis_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'KRITIS')->count(),
            'data_belum_lengkap_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'DATA_BELUM_LENGKAP' || !$s->ewsScore)->count(),
        ];

        // Hitung rata-rata akademik riil sekolah
        $schoolAvgAcademic = AcademicRecord::avg('score');
        $stats['overall_avg_score'] = $schoolAvgAcademic !== null ? round((float) $schoolAvgAcademic, 1) : 0;

        // Hitung persentase presensi riil sekolah (30 hari terakhir)
        $past30Days = Carbon::today()->subDays(30);
        $totalAttRecords = AttendanceRecord::where('date', '>=', $past30Days)->count();
        $presentAttRecords = AttendanceRecord::where('date', '>=', $past30Days)
            ->whereIn('status', ['HADIR', 'TERLAMBAT'])
            ->count();
        $stats['overall_attendance_rate'] = $totalAttRecords > 0
            ? round(($presentAttRecords / $totalAttRecords) * 100, 1)
            : 100;

        // Hitung total observasi & kasus BK aktif
        $stats['total_observations_count'] = BehaviorObservation::where('date', '>=', $past30Days)->count();
        $stats['active_bk_cases_count'] = BkCase::whereIn('status', ['BARU_DILAPORKAN', 'DALAM_PROSES', 'DIESKALASI_KE_KEPSEK'])->count();

        // 1. Daftar Siswa Prioritas (KRITIS, WASPADA, BERISIKO) - Urutkan dari severity tertinggi
        $severityWeight = [
            'KRITIS' => 4,
            'WASPADA' => 3,
            'BERISIKO' => 2,
            'NORMAL' => 1,
            'DATA_BELUM_LENGKAP' => 0,
        ];

        $priorityStudents = $allStudents
            ->filter(fn ($s) => in_array($s->ewsScore?->status, ['KRITIS', 'WASPADA', 'BERISIKO']))
            ->sortByDesc(fn ($s) => $severityWeight[$s->ewsScore?->status ?? 'NORMAL'] ?? 0)
            ->values()
            ->map(function ($s) {
                $totalAtt = $s->attendanceRecords->count();
                $presentCount = $s->attendanceRecords->whereIn('status', ['HADIR', 'TERLAMBAT'])->count();
                $alpaCount = $s->attendanceRecords->where('status', 'ALPA')->count();
                $attRate = $totalAtt > 0 ? round(($presentCount / $totalAtt) * 100, 1) : null;
                $avgScore = $s->academicRecords->isNotEmpty() ? round($s->academicRecords->avg('score'), 1) : null;

                return [
                    'id' => $s->id,
                    'nis' => $s->nis,
                    'nisn' => $s->nisn,
                    'name' => $s->name,
                    'gender' => $s->gender,
                    'class_name' => $s->currentClass()?->name ?? '-',
                    'status' => $s->ewsScore?->status ?? 'DATA_BELUM_LENGKAP',
                    'triggers' => $s->ewsScore?->triggered_by_parameters ?? [],
                    'calculated_at' => $s->ewsScore?->calculated_at ? Carbon::parse($s->ewsScore->calculated_at)->format('d/m/Y H:i') : null,
                    'avg_score' => $avgScore,
                    'attendance_rate' => $attRate,
                    'alpa_count' => $alpaCount,
                    'pillars' => [
                        'ak' => $s->ewsScore?->academic_sub_status ?? 'PENDING',
                        'kh' => $s->ewsScore?->attendance_sub_status ?? 'PENDING',
                        'pr' => $s->ewsScore?->behavior_sub_status ?? 'PENDING',
                        'bk' => $s->ewsScore?->bk_sub_status ?? 'NORMAL',
                    ],
                ];
            });

        // 2. Kasus BK Berat & Eskalasi Kepsek
        $user = $request->user();
        $casesQuery = BkCase::with(['student.classes' => fn ($q) => $q->wherePivot('is_current', true), 'handler']);
        if ($user) {
            $casesQuery->accessibleBy($user);
        }
        $escalatedCases = $casesQuery
            ->where(function ($q) {
                $q->where('severity', 'BERAT')
                  ->orWhere('status', 'DIESKALASI_KE_KEPSEK')
                  ->orWhere('severity', 'SEDANG');
            })
            ->latest('incident_date')
            ->take(10)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'student_id' => $c->student_id,
                    'student_name' => $c->student?->name ?? 'Siswa',
                    'class_name' => $c->student?->currentClass()?->name ?? '-',
                    'nisn' => $c->student?->nisn ?? '-',
                    'incident_date' => $c->incident_date ? Carbon::parse($c->incident_date)->format('d/m/Y') : '-',
                    'category' => $c->category,
                    'severity' => $c->severity,
                    'status' => $c->status,
                    'summary_notes' => $c->summary_notes,
                    'follow_up_plan' => $c->follow_up_plan ?? [],
                    'handler_name' => $c->handler?->name ?? 'Guru BK',
                ];
            });

        // 3. Ringkasan per Rombongan Belajar (Kelas)
        $classesSummary = SchoolClass::with([
            'homeroomTeacher',
            'students.ewsScore',
            'students.academicRecords',
            'students.attendanceRecords' => fn ($q) => $q->where('date', '>=', $past30Days),
        ])->get()->map(function ($cls) {
            $students = $cls->students;
            $tot = $students->count();

            $normal = $students->filter(fn ($s) => $s->ewsScore?->status === 'NORMAL')->count();
            $berisiko = $students->filter(fn ($s) => $s->ewsScore?->status === 'BERISIKO')->count();
            $waspada = $students->filter(fn ($s) => $s->ewsScore?->status === 'WASPADA')->count();
            $kritis = $students->filter(fn ($s) => $s->ewsScore?->status === 'KRITIS')->count();

            // Rata-rata akademik kelas
            $allScores = $students->flatMap->academicRecords->pluck('score');
            $avgScore = $allScores->isNotEmpty() ? round($allScores->avg(), 1) : null;

            // Persentase kehadiran kelas
            $allAtt = $students->flatMap->attendanceRecords;
            $attCount = $allAtt->count();
            $attPresent = $allAtt->whereIn('status', ['HADIR', 'TERLAMBAT'])->count();
            $attRate = $attCount > 0 ? round(($attPresent / $attCount) * 100, 1) : 100;

            return [
                'id' => $cls->id,
                'name' => $cls->name,
                'grade_level' => $cls->grade_level,
                'academic_year' => $cls->academic_year,
                'homeroom_teacher' => $cls->homeroomTeacher?->name ?? 'Belum Ditugaskan',
                'total_students' => $tot,
                'normal_count' => $normal,
                'berisiko_count' => $berisiko,
                'waspada_count' => $waspada,
                'kritis_count' => $kritis,
                'avg_score' => $avgScore,
                'attendance_rate' => $attRate,
            ];
        });

        return Inertia::render('Dashboard/Kepsek', [
            'stats' => $stats,
            'priorityStudents' => $priorityStudents,
            'escalatedCases' => $escalatedCases,
            'classes' => $classesSummary,
        ]);
    }

    public function storeDisposition(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'case_id' => 'nullable|exists:bk_cases,id',
            'student_id' => 'nullable|exists:students,id',
            'instruction' => 'required|string|max:1000',
        ]);

        $user = $request->user();

        if (!empty($validated['case_id'])) {
            $case = BkCase::find($validated['case_id']);
            if ($case) {
                $plan = $case->follow_up_plan ?? [];
                $plan[] = 'Disposisi Kepala Sekolah: ' . $validated['instruction'];
                $case->update([
                    'follow_up_plan' => $plan,
                    'status' => 'DALAM_PROSES',
                ]);
            }
        }

        if ($user) {
            AuditLogger::log(
                user: $user,
                action: 'KEPSEK_DISPOSITION_SUBMITTED',
                targetResource: 'bk_cases',
                resourceId: $validated['case_id'] ?? $validated['student_id'] ?? 0,
                metadata: ['instruction' => $validated['instruction']]
            );
        }

        return back()->with('success', 'Disposisi dan instruksi tindak lanjut berhasil diteruskan ke tim konselor.');
    }
}
