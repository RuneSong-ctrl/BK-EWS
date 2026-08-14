<?php

namespace App\Http\Controllers\Kepsek;

use App\Http\Controllers\Controller;
use App\Models\BkCase;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $allStudents = Student::with(['ewsScore', 'classes' => fn ($q) => $q->wherePivot('is_current', true)])->get();

        $stats = [
            'total_students' => $allStudents->count(),
            'normal_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'NORMAL')->count(),
            'berisiko_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'BERISIKO')->count(),
            'waspada_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'WASPADA')->count(),
            'kritis_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'KRITIS')->count(),
            'data_belum_lengkap_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'DATA_BELUM_LENGKAP' || !$s->ewsScore)->count(),
        ];

        // Daftar Siswa Prioritas (Waspada & Kritis) untuk exception-based management
        $priorityStudents = $allStudents
            ->filter(fn ($s) => in_array($s->ewsScore?->status, ['KRITIS', 'WASPADA']))
            ->values()
            ->map(fn ($s) => [
                'id' => $s->id,
                'nis' => $s->nis,
                'name' => $s->name,
                'gender' => $s->gender,
                'class_name' => $s->currentClass()?->name ?? '-',
                'status' => $s->ewsScore?->status,
                'triggers' => $s->ewsScore?->triggered_by_parameters ?? [],
                'calculated_at' => $s->ewsScore?->calculated_at,
            ]);

        // Kasus BK Berat / Dieskalasi yang boleh diakses Kepsek
        $escalatedCases = BkCase::with(['student', 'handler'])
            ->accessibleBy($request->user())
            ->where(function ($q) {
                $q->where('severity', 'BERAT')
                  ->orWhere('status', 'DIESKALASI_KE_KEPSEK');
            })
            ->latest('incident_date')
            ->take(10)
            ->get();

        $classes = SchoolClass::withCount(['students'])->get();

        return Inertia::render('Kepsek/Dashboard', [
            'stats' => $stats,
            'priorityStudents' => $priorityStudents,
            'escalatedCases' => $escalatedCases,
            'classes' => $classes,
        ]);
    }
}
