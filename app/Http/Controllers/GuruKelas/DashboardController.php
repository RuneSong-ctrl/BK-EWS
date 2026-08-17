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

        // Cari kelas yang diampu oleh wali kelas ini, atau fallback ke kelas pertama jika demo / guest
        $myClass = null;
        if ($user) {
            $myClass = SchoolClass::where('homeroom_teacher_id', $user->id)
                ->with(['enrollments.student.ewsScore'])
                ->first();
        }

        if (!$myClass) {
            $myClass = SchoolClass::with(['enrollments.student.ewsScore'])->first();
        }

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
            ->with([
                'ewsScore',
                'academicRecords',
                'attendanceRecords' => fn ($q) => $q->latest('date')->take(30),
                'behaviorObservations',
            ])
            ->orderBy('name')
            ->get();

            $classStats['total_students'] = $studentList->count();

            foreach ($studentList as $std) {
                $status = $std->ewsScore ? $std->ewsScore->status : 'DATA_BELUM_LENGKAP';
                $key = strtolower($status) . '_count';
                if (isset($classStats[$key])) {
                    $classStats[$key]++;
                }

                // Compute real metrics
                $hasAcademic = $std->academicRecords->isNotEmpty();
                $avgScore = $hasAcademic ? round($std->academicRecords->avg('score'), 1) : null;

                $totalAtt = $std->attendanceRecords->count();
                $presentCount = $std->attendanceRecords->whereIn('status', ['HADIR', 'TERLAMBAT'])->count();
                $alpaCount = $std->attendanceRecords->where('status', 'ALPA')->count();
                $hasAttendance = $totalAtt > 0;
                $attRate = $hasAttendance ? round(($presentCount / $totalAtt) * 100, 1) : null;

                // Pillars mapping
                $akStatus = $std->ewsScore ? $std->ewsScore->academic_sub_status : 'DATA_BELUM_LENGKAP';
                $khStatus = $std->ewsScore ? $std->ewsScore->attendance_sub_status : 'DATA_BELUM_LENGKAP';
                $prStatus = $std->ewsScore ? $std->ewsScore->behavior_sub_status : 'PENDING';
                $bkStatus = $std->ewsScore ? $std->ewsScore->bk_sub_status : 'NORMAL';
                
                // fallback if PENDING or not set
                if ($prStatus === 'PENDING') $prStatus = 'NORMAL';
                if ($akStatus === 'PENDING') $akStatus = 'DATA_BELUM_LENGKAP';
                if ($khStatus === 'PENDING') $khStatus = 'DATA_BELUM_LENGKAP';
                if ($bkStatus === 'PENDING') $bkStatus = 'NORMAL';

                $students[] = [
                    'id' => $std->id,
                    'nis' => $std->nis,
                    'nisn' => $std->nisn,
                    'name' => $std->name,
                    'gender' => $std->gender,
                    'class_name' => $myClass->name,
                    'avg_score' => $avgScore,
                    'score_trend' => $avgScore !== null ? ($avgScore >= 75 ? 'Stabil' : 'Turun') : '-',
                    'attendance_rate' => $attRate,
                    'alpa_count' => $alpaCount,
                    'pillars' => [
                        'ak' => $akStatus,
                        'kh' => $khStatus,
                        'pr' => $prStatus,
                        'bk' => $bkStatus,
                    ],
                    'ews_status' => $status,
                ];
            }
        }

        $subjects = Subject::orderBy('name')->get();

        return Inertia::render('Dashboard/GuruKelas', [
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
