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

        $allStudents = Student::with('ewsScore')->get();
        $stats = [
            'total_students' => $allStudents->count(),
            'normal_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'NORMAL')->count(),
            'berisiko_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'BERISIKO')->count(),
            'waspada_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'WASPADA')->count(),
            'kritis_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'KRITIS')->count(),
            'data_belum_lengkap_count' => $allStudents->filter(fn ($s) => $s->ewsScore?->status === 'DATA_BELUM_LENGKAP' || !$s->ewsScore)->count(),
        ];

        $students = $query->orderBy('name')->paginate(15)->withQueryString();

        $classes = SchoolClass::orderBy('name')->get(['id', 'name', 'grade_level', 'academic_year']);

        return Inertia::render('Dashboard/GuruBk', [
            'students' => $students,
            'stats' => $stats,
            'classes' => $classes,
            'filters' => [
                'status' => $statusFilter,
                'class_id' => $classFilter,
                'search' => $search,
            ],
        ]);
    }
}
