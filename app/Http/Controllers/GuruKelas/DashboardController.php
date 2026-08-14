<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Cari kelas yang diampu oleh wali kelas ini
        $myClass = SchoolClass::where('homeroom_teacher_id', $user->id)
            ->with(['enrollments.student.ewsScore'])
            ->first();

        $students = [];
        $classStats = [
            'total_students' => 0,
            'normal_count' => 0,
            'berisiko_count' => 0,
            'waspada_count' => 0,
            'kritis_count' => 0,
            'data_belum_lengkap_count' => 0,
        ];

        if ($myClass) {
            $studentList = Student::whereHas('enrollments', function ($query) use ($myClass) {
                $query->where('class_id', $myClass->id)->where('is_current', true);
            })
            ->with(['ewsScore', 'attendanceRecords' => fn ($q) => $q->latest('date')->take(7)])
            ->get();

            $classStats['total_students'] = $studentList->count();

            foreach ($studentList as $std) {
                $status = $std->ewsScore ? $std->ewsScore->status : 'DATA_BELUM_LENGKAP';
                $key = strtolower($status) . '_count';
                if (isset($classStats[$key])) {
                    $classStats[$key]++;
                }

                $students[] = [
                    'id' => $std->id,
                    'nis' => $std->nis,
                    'nisn' => $std->nisn,
                    'name' => $std->name,
                    'gender' => $std->gender,
                    'status' => $std->status,
                    'ews_score' => $std->ewsScore,
                ];
            }
        }

        $subjects = Subject::orderBy('name')->get();

        return Inertia::render('GuruKelas/Dashboard', [
            'schoolClass' => $myClass ? [
                'id' => $myClass->id,
                'name' => $myClass->name,
                'grade_level' => $myClass->grade_level,
                'academic_year' => $myClass->academic_year,
            ] : null,
            'students' => $students,
            'stats' => $classStats,
            'subjects' => $subjects,
        ]);
    }
}
