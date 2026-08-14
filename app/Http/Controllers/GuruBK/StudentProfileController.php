<?php

namespace App\Http\Controllers\GuruBK;

use App\Http\Controllers\Controller;
use App\Models\BkCase;
use App\Models\Student;
use App\Services\Ai\AiAdvisorService;
use App\Services\Ews\EwsScoringService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentProfileController extends Controller
{
    public function __construct(
        protected AiAdvisorService $aiAdvisorService,
        protected EwsScoringService $scoringService
    ) {}

    public function show(Request $request, Student $student): Response
    {
        $student->load([
            'classes' => fn ($q) => $q->wherePivot('is_current', true),
            'ewsScore',
            'ewsHistory' => fn ($q) => $q->orderBy('recorded_at', 'desc')->take(10),
            'academicRecords' => fn ($q) => $q->with('subject')->latest('created_at')->take(15),
            'attendanceRecords' => fn ($q) => $q->where('date', '>=', Carbon::today()->subDays(30))->orderBy('date', 'desc'),
            'behaviorObservations' => fn ($q) => $q->with('confirmedByUser')->latest('date')->take(15),
            'aiLogs' => fn ($q) => $q->orderBy('generated_at', 'desc')->take(5),
        ]);

        // Muat kasus BK sesuai hak akses Guru BK
        $bkCasesQuery = BkCase::where('student_id', $student->id)->with('handler');
        if ($request->user()) {
            $bkCasesQuery->accessibleBy($request->user());
        }
        $bkCases = $bkCasesQuery->orderBy('incident_date', 'desc')->get();

        return Inertia::render('Students/Show', [
            'student' => $student,
            'bkCases' => $bkCases,
            'currentClass' => $student->currentClass(),
        ]);
    }

    /**
     * Trigger kalkulasi ulang AI Advisor secara on-demand
     */
    public function generateAiAdvice(Request $request, Student $student): RedirectResponse
    {
        $this->scoringService->evaluate($student);
        $this->aiAdvisorService->generateAnalysis($student);

        return back()->with('success', 'Analisis dan rekomendasi AI EWS berhasil diperbarui.');
    }
}
