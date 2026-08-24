<?php

namespace App\Http\Controllers\GuruKelas;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Services\Ews\EwsScoringService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller: AttendanceController (Modul Guru Kelas)
 * 
 * Bertanggung jawab menangani input dan rekapitulasi presensi harian siswa secara massal.
 * Terintegrasi langsung dengan EwsScoringService untuk pembaruan instan Pilar Kehadiran (KH).
 */
class AttendanceController extends Controller
{
    public function __construct(
        protected EwsScoringService $scoringService
    ) {}

    /**
     * Simpan / perbarui presensi harian siswa satu kelas secara massal (Batch Processing).
     * Dibungkus dalam DB::transaction untuk integritas data dan menggunakan batch re-evaluasi EWS.
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function storeBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'attendances' => ['required', 'array', 'min:1'],
            'attendances.*.student_id' => ['required', 'exists:students,id'],
            'attendances.*.status' => ['required', 'in:HADIR,SAKIT,IZIN,ALPA,TERLAMBAT'],
            'attendances.*.check_in_time' => ['nullable', 'date_format:H:i'],
            'attendances.*.late_minutes' => ['nullable', 'integer', 'min:0'],
            'attendances.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        $userId = $request->user()->id;
        $dateFormatted = Carbon::parse($validated['date'])->format('Y-m-d');
        $studentIds = collect($validated['attendances'])->pluck('student_id')->unique()->all();

        DB::transaction(function () use ($validated, $userId, $dateFormatted, $studentIds) {
            // Eager load rekam absensi yang sudah ada untuk tanggal bersangkutan (Mencegah N+1 Query)
            $existingRecords = AttendanceRecord::whereIn('student_id', $studentIds)
                ->whereDate('date', $dateFormatted)
                ->get()
                ->keyBy('student_id');

            foreach ($validated['attendances'] as $item) {
                $studentId = $item['student_id'];
                $data = [
                    'status' => $item['status'],
                    'check_in_time' => $item['check_in_time'] ?? null,
                    'late_minutes' => $item['late_minutes'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                    'created_by' => $userId,
                ];

                if (isset($existingRecords[$studentId])) {
                    $existingRecords[$studentId]->update($data);
                } else {
                    AttendanceRecord::create(array_merge([
                        'student_id' => $studentId,
                        'date' => $dateFormatted,
                    ], $data));
                }
            }

            // Batch re-evaluasi EWS siswa terkait dalam satu transaksi
            $students = Student::whereIn('id', $studentIds)->get();
            $this->scoringService->evaluateMany($students);
        });

        return back()->with('success', 'Rekap absensi harian berhasil disimpan dan skor EWS telah diperbarui.');
    }
}

