<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\BehaviorObservation;
use App\Models\Student;
use App\Models\User;
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
     * API: Autocomplete & draft AI text structuring for observation input
     */
    public function structureWithAi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_text' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'severity' => ['nullable', 'string'],
            'preset_topic' => ['nullable', 'string'],
            'keywords' => ['nullable', 'string'],
            'student_name' => ['nullable', 'string'],
        ]);

        $rawText = $validated['raw_text'] ?? '';
        $options = [
            'category' => $validated['category'] ?? null,
            'severity' => $validated['severity'] ?? null,
            'preset_topic' => $validated['preset_topic'] ?? null,
            'keywords' => $validated['keywords'] ?? null,
            'student_name' => $validated['student_name'] ?? 'Siswa',
        ];

        $structured = $this->aiStructuringService->structureObservation($rawText, $options);

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
        // Normalisasi alias kategori jika dikirim dari variasi dropdown
        $categoryMap = [
            'BULLYING_TERDUGA' => 'AGRESIF_FISIK',
            'DISRUPSI_KELAS' => 'TIDAK_FOKUS',
            'KEDISIPLINAN' => 'PELANGGARAN_ATURAN',
            'AGRESI_VERBAL' => 'AGRESIF_VERBAL',
            'PROSOSIAL' => 'PERILAKU_POSITIF',
        ];

        $rawCategory = $request->input('category');
        if (isset($categoryMap[$rawCategory])) {
            $request->merge(['category' => $categoryMap[$rawCategory]]);
        }

        $rawText = $request->input('raw_text') ?? $request->input('narrative') ?? $request->input('notes') ?? 'Observasi perilaku kelas';
        $request->merge(['raw_text' => $rawText]);

        if (!$request->has('category') || empty($request->input('category'))) {
            $request->merge(['category' => 'TIDAK_FOKUS']);
        }

        if (!$request->has('severity') || empty($request->input('severity'))) {
            $request->merge(['severity' => 'RINGAN']);
        }

        if (!$request->has('ai_structured_summary') || empty($request->input('ai_structured_summary'))) {
            $request->merge(['ai_structured_summary' => mb_substr($rawText, 0, 200)]);
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'date' => ['required', 'date'],
            'category' => ['required', 'string', 'in:MENARIK_DIRI,AGRESIF_FISIK,AGRESIF_VERBAL,TIDAK_FOKUS,PELANGGARAN_ATURAN,PERILAKU_POSITIF,BULLYING_TERDUGA,DISRUPSI_KELAS,KEDISIPLINAN,AGRESI_VERBAL,PROSOSIAL'],
            'severity' => ['required', 'string', 'in:RINGAN,SEDANG,BERAT'],
            'raw_text' => ['required', 'string'],
            'ai_structured_summary' => ['required', 'string', 'max:255'],
        ]);

        $category = $categoryMap[$validated['category']] ?? $validated['category'];
        $student = Student::findOrFail($validated['student_id']);

        $confirmedBy = $request->user()?->id ?? User::where('role', 'guru_kelas')->first()?->id ?? User::first()->id;

        BehaviorObservation::create([
            'student_id' => $student->id,
            'date' => $validated['date'],
            'category' => $category,
            'severity' => $validated['severity'],
            'raw_text' => $validated['raw_text'],
            'ai_structured_summary' => $validated['ai_structured_summary'],
            'confirmed_by' => $confirmedBy,
        ]);

        // Recalculate EWS score
        $this->scoringService->evaluate($student);

        return back()->with('success', 'Observasi perilaku berhasil dicatat dan skor EWS telah diperbarui.');
    }
}
