<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\AcademicRecord;
use App\Models\Student;
use App\Services\Ews\EwsScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller: AcademicController (Modul Guru Kelas)
 * 
 * Bertanggung jawab menangani input nilai akademik siswa (individu maupun massal).
 * Terintegrasi langsung dengan EwsScoringService untuk pembaruan instan Pilar Akademik (AK).
 */
class AcademicController extends Controller
{
    public function __construct(
        protected EwsScoringService $scoringService
    ) {}

    /**
     * Input nilai akademik siswa per individu
     *
     * @param Request $request
     * @return RedirectResponse
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

        DB::transaction(function () use ($validated, $student, $request) {
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
        });

        return back()->with('success', 'Nilai akademik berhasil dicatat dan skor EWS telah diperbarui.');
    }

    /**
     * Input rekap nilai akademik kelas secara massal (Batch Processing).
     * Dibungkus dalam DB::transaction dan menggunakan batch evaluation untuk efisiensi kueri.
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function storeBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject_id' => ['required', 'exists:subjects,id'],
            'assessment_type' => ['required', 'in:TUGAS,UH,UTS,UAS'],
            'period' => ['required', 'string', 'max:50'],
            'academic_year' => ['required', 'string', 'max:20'],
            'scores' => ['required', 'array', 'min:1'],
            'scores.*.student_id' => ['required', 'exists:students,id'],
            'scores.*.score' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $userId = $request->user()->id;
        $studentIds = collect($validated['scores'])->pluck('student_id')->unique()->all();

        DB::transaction(function () use ($validated, $userId, $studentIds) {
            foreach ($validated['scores'] as $item) {
                $scoreVal = floatval($item['score']);
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
            }

            // Batch re-evaluasi EWS pilar akademik untuk seluruh siswa terkait
            $students = Student::whereIn('id', $studentIds)->get();
            $this->scoringService->evaluateMany($students);
        });

        return back()->with('success', 'Rekap nilai akademik berhasil dicatat dan pilar Akademik (AK) EWS telah diperbarui.');
    }
}


