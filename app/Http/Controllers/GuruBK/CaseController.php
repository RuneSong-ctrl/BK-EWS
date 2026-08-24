<?php

namespace App\Http\Controllers\GuruBK;

use App\Http\Controllers\Controller;
use App\Models\BkCase;
use App\Models\Student;
use App\Services\Ai\AiTextStructuringService;
use App\Services\Ews\EwsScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller: CaseController (Modul Guru BK)
 * 
 * Bertanggung jawab mengelola kasus bimbingan konseling, penanganan perundungan,
 * pencatatan sesi bimbingan psikososial, dan integrasi Pilar BK pada sistem EWS.
 */
class CaseController extends Controller
{
    public function __construct(
        protected EwsScoringService $scoringService,
        protected AiTextStructuringService $aiStructuringService
    ) {}

    /**
     * AI structuring & auto-complete helper untuk konseling BK
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function structureWithAi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_text' => ['nullable', 'string', 'max:2000'],
            'case_category' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'urgency_level' => ['nullable', 'string', 'in:RINGAN,SEDANG,BERAT'],
            'severity' => ['nullable', 'string', 'in:RINGAN,SEDANG,BERAT'],
            'preset_topic' => ['nullable', 'string', 'max:255'],
            'keywords' => ['nullable', 'string', 'max:500'],
            'student_name' => ['nullable', 'string', 'max:255'],
        ]);

        $rawText = $validated['raw_text'] ?? $validated['keywords'] ?? $validated['preset_topic'] ?? '';
        $options = [
            'case_category' => $validated['case_category'] ?? $validated['category'] ?? null,
            'urgency_level' => $validated['urgency_level'] ?? $validated['severity'] ?? null,
            'preset_topic' => $validated['preset_topic'] ?? null,
            'keywords' => $validated['keywords'] ?? null,
            'student_name' => $validated['student_name'] ?? 'Siswa',
        ];

        $structured = $this->aiStructuringService->structureBkObservation($rawText, $options);

        return response()->json([
            'success' => true,
            'data' => $structured,
        ]);
    }

    /**
     * Input kasus bimbingan konseling baru.
     * Dibungkus dalam DB::transaction untuk integritas data dan pembaruan instan EWS.
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'incident_date' => ['required', 'date'],
            'reported_date' => ['required', 'date'],
            'case_types' => ['required', 'array', 'min:1'],
            'bullying_role' => ['nullable', 'in:KORBAN,PELAKU,SAKSI'],
            'severity' => ['required', 'in:RINGAN,SEDANG,BERAT'],
            'status' => ['required', 'in:BARU_DILAPORKAN,DALAM_PROSES,DIESKALASI_KE_KEPSEK,DIRUJUK_EKSTERNAL,SELESAI'],
            'follow_up_actions' => ['required', 'array'],
            'involved_students_count' => ['nullable', 'integer', 'min:1'],
            'confidential_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $student = Student::findOrFail($validated['student_id']);
        $handledBy = $request->user()->id;

        DB::transaction(function () use ($student, $validated, $handledBy) {
            BkCase::create([
                'student_id' => $student->id,
                'incident_date' => $validated['incident_date'],
                'reported_date' => $validated['reported_date'],
                'case_types' => $validated['case_types'],
                'bullying_role' => $validated['bullying_role'] ?? null,
                'severity' => $validated['severity'],
                'status' => $validated['status'],
                'follow_up_actions' => $validated['follow_up_actions'],
                'involved_students_count' => $validated['involved_students_count'] ?? 1,
                'confidential_notes' => isset($validated['confidential_notes']) ? strip_tags($validated['confidential_notes']) : null,
                'handled_by' => $handledBy,
            ]);

            // Re-evaluate EWS
            $this->scoringService->evaluate($student);
        });

        return back()->with('success', 'Kasus bimbingan konseling berhasil dicatat dan status EWS diperbarui.');
    }

    /**
     * Update status penanganan kasus BK
     *
     * @param Request $request
     * @param BkCase $bkCase
     * @return RedirectResponse
     */
    public function updateStatus(Request $request, BkCase $bkCase): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:BARU_DILAPORKAN,DALAM_PROSES,DIESKALASI_KE_KEPSEK,DIRUJUK_EKSTERNAL,SELESAI'],
            'follow_up_actions' => ['nullable', 'array'],
            'confidential_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($bkCase, $validated) {
            $bkCase->status = $validated['status'];
            if (isset($validated['follow_up_actions'])) {
                $bkCase->follow_up_actions = $validated['follow_up_actions'];
            }
            if (isset($validated['confidential_notes'])) {
                $bkCase->confidential_notes = strip_tags($validated['confidential_notes']);
            }
            $bkCase->save();

            // Re-evaluate EWS for the student
            $this->scoringService->evaluate($bkCase->student);
        });

        return back()->with('success', 'Status penanganan kasus BK berhasil diperbarui.');
    }
}

