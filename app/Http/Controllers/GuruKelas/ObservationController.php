<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\BehaviorObservation;
use App\Models\Student;
use App\Services\Ai\AiTextStructuringService;
use App\Services\Ews\EwsScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ObservationController extends Controller
{
    public function __construct(
        protected AiTextStructuringService $aiStructuringService,
        protected EwsScoringService $scoringService
    ) {}

    /**
     * API: Autocomplete AI text structuring for observation input
     */
    public function structureWithAi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_text' => ['required', 'string', 'min:3'],
        ]);

        $structured = $this->aiStructuringService->structureObservation($validated['raw_text']);

        return response()->json([
            'success' => true,
            'data' => $structured,
        ]);
    }

    /**
     * Simpan observasi perilaku terkonfirmasi oleh guru kelas
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'date' => ['required', 'date'],
            'category' => ['required', 'in:MENARIK_DIRI,AGRESIF_FISIK,AGRESIF_VERBAL,TIDAK_FOKUS,PELANGGARAN_ATURAN,PERILAKU_POSITIF'],
            'severity' => ['required', 'in:RINGAN,SEDANG,BERAT'],
            'raw_text' => ['required', 'string'],
            'ai_structured_summary' => ['required', 'string', 'max:255'],
        ]);

        $student = Student::findOrFail($validated['student_id']);

        BehaviorObservation::create([
            'student_id' => $student->id,
            'date' => $validated['date'],
            'category' => $validated['category'],
            'severity' => $validated['severity'],
            'raw_text' => $validated['raw_text'],
            'ai_structured_summary' => $validated['ai_structured_summary'],
            'confirmed_by' => $request->user()->id,
        ]);

        // Recalculate EWS score
        $this->scoringService->evaluate($student);

        return back()->with('success', 'Observasi perilaku berhasil dicatat dan skor EWS telah diperbarui.');
    }
}
