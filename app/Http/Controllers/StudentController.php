<?php

namespace App\Http\Controllers;

use App\Models\BkCase;
use App\Models\Student;
use App\Services\Ai\AiAdvisorService;
use App\Services\Audit\AuditLogger;
use App\Services\Ews\EwsScoringService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function __construct(
        protected AiAdvisorService $aiAdvisorService,
        protected EwsScoringService $scoringService
    ) {}

    /**
     * Tampilkan profil komprehensif Siswa 360 & EWS
     */
    public function show(Request $request, $studentId): Response
    {
        $user = $request->user();
        $student = Student::find($studentId);

        if (!$student) {
            $student = Student::first();
        }

        if ($student) {
            // PDP Compliance Audit Log
            if ($user) {
                AuditLogger::log(
                    user: $user,
                    action: 'VIEW_STUDENT_EWS_MONITOR',
                    targetResource: 'students',
                    resourceId: $student->id
                );
            }

            $student->load([
                'classes' => fn ($q) => $q->wherePivot('is_current', true)->with('homeroomTeacher'),
                'ewsScore',
                'ewsHistory' => fn ($q) => $q->orderBy('recorded_at', 'desc')->take(10),
                'academicRecords' => fn ($q) => $q->with('subject')->latest('created_at')->take(20),
                'attendanceRecords' => fn ($q) => $q->where('date', '>=', Carbon::today()->subDays(30))->orderBy('date', 'desc'),
                'behaviorObservations' => fn ($q) => $q->with('confirmedByUser')->latest('date')->take(20),
                'aiLogs' => fn ($q) => $q->orderBy('generated_at', 'desc')->take(5),
            ]);

            // Muat kasus BK dengan filter hak akses peran (UU PDP / Confidentiality)
            $bkCasesQuery = BkCase::where('student_id', $student->id)->with('handler');
            if ($user) {
                $bkCasesQuery->accessibleBy($user);
            }
            $bkCases = $bkCasesQuery->orderBy('incident_date', 'desc')->get();
            $currentClass = $student->classes->first();
        } else {
            $bkCases = collect();
            $currentClass = null;
        }

        return Inertia::render('Students/Show', [
            'student' => $student,
            'bkCases' => $bkCases,
            'currentClass' => $currentClass,
        ]);
    }

    /**
     * Trigger kalkulasi ulang AI Advisor secara on-demand
     */
    public function generateAiAdvice(Request $request, $studentId): RedirectResponse
    {
        $student = Student::find($studentId) ?? Student::first();

        if ($student) {
            $this->scoringService->evaluate($student);
            $this->aiAdvisorService->generateAnalysis($student);
        }

        return back()->with('success', 'Analisis dan rekomendasi AI EWS berhasil diperbarui.');
    }
}
