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
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'is_remedial' => ['boolean'],
            'previous_score' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $student = Student::findOrFail($validated['student_id']);

        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $validated['subject_id'],
            'assessment_type' => $validated['assessment_type'],
            'period' => $validated['period'],
            'academic_year' => $validated['academic_year'],
            'score' => intval($validated['score']),
            'is_remedial' => $validated['is_remedial'] ?? false,
            'previous_score' => isset($validated['previous_score']) ? intval($validated['previous_score']) : null,
            'created_by' => $request->user()->id,
        ]);

        // Recalculate EWS
        $this->scoringService->evaluate($student);

        return back()->with('success', 'Nilai akademik berhasil dicatat dan skor EWS telah diperbarui.');
    }

    /**
     * Input rekap nilai akademik kelas secara massal
     */
    public function storeBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject_id' => ['required', 'exists:subjects,id'],
            'assessment_type' => ['required', 'in:TUGAS,UH,UTS,UAS'],
            'period' => ['required', 'string', 'max:50'],
            'academic_year' => ['required', 'string', 'max:20'],
            'scores' => ['required', 'array'],
            'scores.*.student_id' => ['required', 'exists:students,id'],
            'scores.*.score' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $userId = $request->user()->id;

        foreach ($validated['scores'] as $item) {
            $scoreVal = intval($item['score']);
            AcademicRecord::create([
                'student_id' => $item['student_id'],
                'subject_id' => $validated['subject_id'],
                'assessment_type' => $validated['assessment_type'],
                'period' => $validated['period'],
                'academic_year' => $validated['academic_year'],
                'score' => $scoreVal,
                'is_remedial' => $scoreVal < 75,
                'created_by' => $userId,
            ]);

            // Re-evaluate EWS
            $student = Student::find($item['student_id']);
            if ($student) {
                $this->scoringService->evaluate($student);
            }
        }

        return back()->with('success', 'Rekap nilai akademik berhasil dicatat dan pilar Akademik (AK) EWS telah diperbarui.');
    }
}
