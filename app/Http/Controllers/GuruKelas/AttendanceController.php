<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Services\Ews\EwsScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        protected EwsScoringService $scoringService
    ) {}

    /**
     * Input absensi harian kelas secara massal
     */
    public function storeBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'attendances' => ['required', 'array'],
            'attendances.*.student_id' => ['required', 'exists:students,id'],
            'attendances.*.status' => ['required', 'in:HADIR,SAKIT,IZIN,ALPA,TERLAMBAT'],
            'attendances.*.check_in_time' => ['nullable', 'date_format:H:i'],
            'attendances.*.late_minutes' => ['nullable', 'integer', 'min:0'],
            'attendances.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        $userId = $request->user()->id;
        $date = $validated['date'];

        foreach ($validated['attendances'] as $item) {
            AttendanceRecord::updateOrCreate(
                [
                    'student_id' => $item['student_id'],
                    'date' => $date,
                ],
                [
                    'status' => $item['status'],
                    'check_in_time' => $item['check_in_time'] ?? null,
                    'late_minutes' => $item['late_minutes'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                    'created_by' => $userId,
                ]
            );

            // Re-evaluate EWS
            $student = Student::find($item['student_id']);
            if ($student) {
                $this->scoringService->evaluate($student);
            }
        }

        return back()->with('success', 'Rekap absensi harian berhasil disimpan dan skor EWS telah diperbarui.');
    }
}
