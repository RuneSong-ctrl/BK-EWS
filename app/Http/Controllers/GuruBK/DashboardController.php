<?php

namespace App\Http\Controllers\GuruBK;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $statusFilter = $request->query('status');
        $classFilter = $request->query('class_id');
        $search = $request->query('search');

        $query = Student::query()
            ->with(['ewsScore', 'classes' => fn ($q) => $q->wherePivot('is_current', true)]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        if ($classFilter) {
            $query->whereHas('enrollments', function ($q) use ($classFilter) {
                $q->where('class_id', $classFilter)->where('is_current', true);
            });
        }

        if ($statusFilter) {
            $query->whereHas('ewsScore', function ($q) use ($statusFilter) {
                $q->where('status', $statusFilter);
            });
        }

        $allStudents = Student::with(['ewsScore', 'classes' => fn ($q) => $q->wherePivot('is_current', true)])->get();
        $stats = [
            'total_students' => $allStudents->count(),
            'normal_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'NORMAL')->count(),
            'berisiko_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'BERISIKO')->count(),
            'waspada_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'WASPADA')->count(),
            'kritis_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'KRITIS')->count(),
            'data_belum_lengkap_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'DATA_BELUM_LENGKAP' || !$s->ewsScore)->count(),
        ];

        // Watchlist (Kritis & Waspada)
        $watchlist = $allStudents
            ->filter(fn ($s) => in_array($s->ewsScore?->status, ['KRITIS', 'WASPADA']))
            ->values()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'class_name' => $s->currentClass()?->name ?? '-',
                'trigger' => !empty($s->ewsScore?->triggered_by_parameters)
                    ? implode(' & ', array_slice($s->ewsScore->triggered_by_parameters, 0, 2))
                    : 'Terdeteksi anomali evaluasi 4 pilar',
                'status' => $s->ewsScore?->status ?? 'WASPADA',
                'urgency' => $s->ewsScore?->status === 'KRITIS' ? 'Mendesak (Tindak Lanjut Segera)' : 'Sesi Konseling Individu',
            ]);

        // Kasus BK Riil
        $user = $request->user();
        $casesQuery = \App\Models\BkCase::with(['student', 'handler']);
        if ($user) {
            $casesQuery->accessibleBy($user);
        }
        $recentCases = $casesQuery->latest('incident_date')->take(10)->get()->map(fn ($c) => [
            'id' => $c->id,
            'title' => !empty($c->case_types) ? implode(', ', (array)$c->case_types) : 'Sesi Bimbingan Konseling',
            'student_name' => $c->student?->name ?? 'Siswa Terdaftar',
            'class_name' => $c->student?->currentClass()?->name ?? '-',
            'severity' => $c->severity,
            'status' => $c->status,
            'date' => $c->incident_date?->format('d M Y') ?? now()->format('d M Y'),
            'counselor' => $c->handler?->name ?? 'Guru BK',
        ]);

        $students = $query->orderBy('name')->paginate(15)->withQueryString();

        $classes = SchoolClass::orderBy('name')->get(['id', 'name', 'grade_level', 'academic_year']);

        return Inertia::render('Dashboard/GuruBk', [
            'students' => $students,
            'stats' => $stats,
            'classes' => $classes,
            'watchlist' => $watchlist,
            'recentCases' => $recentCases,
            'allStudentOptions' => $allStudents->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'nisn' => $s->nisn,
                'class_name' => $s->currentClass()?->name ?? '-',
                'ews_status' => $s->ewsScore?->status ?? 'NORMAL',
            ]),
            'filters' => [
                'status' => $statusFilter,
                'class_id' => $classFilter,
                'search' => $search,
            ],
        ]);
    }
}
