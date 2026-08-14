<?php

namespace App\Http\Controllers\Kepsek;

use App\Http\Controllers\Controller;
use App\Models\BkCase;
use App\Models\Student;
use App\Services\Audit\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentMonitorController extends Controller
{
    public function show(Request $request, $studentId): Response
    {
        $user = $request->user();
        $student = Student::find($studentId) ?? Student::first();

        if ($student) {
            // Audit Logging (UU PDP & Governance Requirement)
            if ($user) {
                AuditLogger::log(
                    user: $user,
                    action: 'VIEW_STUDENT_EWS_MONITOR',
                    targetResource: 'students',
                    resourceId: $student->id
                );
            }

            $student->load([
                'classes' => fn ($q) => $q->wherePivot('is_current', true),
                'ewsScore',
                'ewsHistory' => fn ($q) => $q->orderBy('recorded_at', 'desc')->take(10),
                'academicRecords' => fn ($q) => $q->with('subject')->latest('created_at')->take(15),
                'attendanceRecords' => fn ($q) => $q->where('date', '>=', Carbon::today()->subDays(30))->orderBy('date', 'desc'),
                'behaviorObservations' => fn ($q) => $q->latest('date')->take(15),
                'aiLogs' => fn ($q) => $q->orderBy('generated_at', 'desc')->take(5),
            ]);

            // Kasus BK hanya yang lolos scope accessibleBy untuk Kepsek
            $bkCasesQuery = BkCase::where('student_id', $student->id)->with('handler');
            if ($user) {
                $bkCasesQuery->accessibleBy($user);
            }
            $bkCases = $bkCasesQuery->orderBy('incident_date', 'desc')->get();
        } else {
            $bkCases = collect();
        }

        return Inertia::render('Students/Show', [
            'student' => $student,
            'bkCases' => $bkCases,
            'currentClass' => $student?->currentClass(),
        ]);
    }
}
