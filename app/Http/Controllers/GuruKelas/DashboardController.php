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
                $hadirCount = $std->attendanceRecords->where('status', 'HADIR')->count();
                $alpaCount = $std->attendanceRecords->where('status', 'ALPA')->count();
                $hasAttendance = $totalAtt > 0;
                $attRate = $hasAttendance ? round(($hadirCount / $totalAtt) * 100, 1) : null;

                // Pillars mapping
                $akStatus = 'DATA_BELUM_LENGKAP';
                if ($hasAcademic) {
                    $akStatus = 'NORMAL';
                    if ($avgScore < 65) $akStatus = 'KRITIS';
                    elseif ($avgScore < 70) $akStatus = 'WASPADA';
                    elseif ($avgScore < 75) $akStatus = 'BERISIKO';
                }

                $khStatus = 'DATA_BELUM_LENGKAP';
                if ($hasAttendance) {
                    $khStatus = 'NORMAL';
                    if ($alpaCount >= 5 || $attRate < 75) $khStatus = 'KRITIS';
                    elseif ($alpaCount >= 3 || $attRate < 85) $khStatus = 'WASPADA';
                    elseif ($alpaCount >= 1 || $attRate < 90) $khStatus = 'BERISIKO';
                }

                $prStatus = 'NORMAL';
                if ($std->behaviorObservations->isNotEmpty()) {
                    $prStatus = $std->behaviorObservations->where('severity', 'BERAT')->isNotEmpty() ? 'KRITIS'
                        : ($std->behaviorObservations->where('severity', 'SEDANG')->isNotEmpty() ? 'WASPADA' : 'NORMAL');
                }

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
                        'bk' => 'NORMAL',
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
