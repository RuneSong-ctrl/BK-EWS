<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\AcademicRecord;
use App\Models\Student;
use App\Services\Ews\EwsScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AcademicController extends Controller
{
    public function __construct(
        protected EwsScoringService $scoringService
    ) {}

    /**
     * Input nilai akademik siswa
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'assessment_type' => ['required', 'in:TUGAS,UH,UTS,UAS'],
            'period' => ['required', 'string', 'max:50'],
            'academic_year' => ['required', 'string', 'max:20'],
            'score' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_remedial' => ['boolean'],
            'previous_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $student = Student::findOrFail($validated['student_id']);

        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $validated['subject_id'],
            'assessment_type' => $validated['assessment_type'],
            'period' => $validated['period'],
            'academic_year' => $validated['academic_year'],
            'score' => $validated['score'],
            'is_remedial' => $validated['is_remedial'] ?? false,
            'previous_score' => $validated['previous_score'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        // Recalculate EWS
        $this->scoringService->evaluate($student);

        return back()->with('success', 'Nilai akademik berhasil dicatat dan skor EWS telah diperbarui.');
    }
}
