<?php

namespace App\Services\Ews;

use App\Models\EwsScore;
use App\Models\EwsScoreHistory;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EwsScoringService
{
    public const STATUS_DATA_BELUM_LENGKAP = 'DATA_BELUM_LENGKAP';
    public const STATUS_NORMAL = 'NORMAL';
    public const STATUS_BERISIKO = 'BERISIKO';
    public const STATUS_WASPADA = 'WASPADA';
    public const STATUS_KRITIS = 'KRITIS';

    private array $severityRank = [
        'PENDING' => 0,
        'NORMAL' => 1,
        'BERISIKO' => 2,
        'WASPADA' => 3,
        'KRITIS' => 4,
    ];

    public function evaluate(Student $student): EwsScore
    {
        $triggers = [];

        // 1. Evaluasi Pilar Akademik
        $academicResult = $this->evaluateAcademic($student);
        if (!empty($academicResult['trigger'])) {
            $triggers[] = $academicResult['trigger'];
        }

        // 2. Evaluasi Pilar Kehadiran
        $attendanceResult = $this->evaluateAttendance($student);
        if (!empty($attendanceResult['trigger'])) {
            $triggers[] = $attendanceResult['trigger'];
        }

        // 3. Evaluasi Pilar Perilaku
        $behaviorResult = $this->evaluateBehavior($student);
        if (!empty($behaviorResult['trigger'])) {
            $triggers[] = $behaviorResult['trigger'];
        }

        // 4. Evaluasi Pilar Kasus BK
        $bkResult = $this->evaluateBkCases($student);
        if (!empty($bkResult['trigger'])) {
            $triggers[] = $bkResult['trigger'];
        }

        // 5. Emergency Override: Jika ada kasus BK Berat / Alpa > 5 / Nilai < 50 / Perilaku Berat -> Langsung KRITIS
        $isEmergencyCritical = ($bkResult['sub_status'] === self::STATUS_KRITIS)
            || ($attendanceResult['sub_status'] === self::STATUS_KRITIS)
            || ($academicResult['sub_status'] === self::STATUS_KRITIS)
            || ($behaviorResult['sub_status'] === self::STATUS_KRITIS);

        // Algoritma Max-Severity (Worst-Case Paradigm)
        $statuses = [
            $academicResult['sub_status'],
            $attendanceResult['sub_status'],
            $behaviorResult['sub_status'],
            $bkResult['sub_status'],
        ];

        $maxRank = 1;
        $finalStatus = self::STATUS_NORMAL;

        foreach ($statuses as $st) {
            $rank = $this->severityRank[$st] ?? 0;
            if ($rank > $maxRank) {
                $maxRank = $rank;
                $finalStatus = $st;
            }
        }

        // 6. Data Completeness Gate: Siswa hanya berstatus NORMAL jika memiliki kuota minimum baseline data
        // (minimal 2 rekam akademik atau 5 hari presensi). Jika tidak ada pemicu risiko dan data kurang -> DATA_BELUM_LENGKAP
        $academicCount = $student->academicRecords()->count();
        $attendanceCount = $student->attendanceRecords()->count();
        $hasAdequateBaseline = ($academicCount >= 2) || ($attendanceCount >= 5);

        if ($maxRank === 1 && !$hasAdequateBaseline) {
            $finalStatus = self::STATUS_DATA_BELUM_LENGKAP;
        }

        // 7. Simpan Skor & Catat Riwayat Transisi Status
        return $this->persistScore($student, $finalStatus, [
            'academic' => $academicResult['sub_status'],
            'attendance' => $attendanceResult['sub_status'],
            'behavior' => $behaviorResult['sub_status'],
            'bk' => $bkResult['sub_status'],
            'triggers' => $triggers,
        ]);
    }

    public function evaluateAcademic(Student $student): array
    {
        $records = $student->academicRecords()
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        if ($records->count() === 0) {
            return ['sub_status' => 'PENDING', 'trigger' => null];
        }

        $avgScore = (float) $records->avg('score');

        // Cek tren penurunan jika ada minimal 3 data
        $isDecreasingTrend = false;
        if ($records->count() >= 3) {
            $s1 = (float) $records[0]->score; // terbaru
            $s2 = (float) $records[1]->score;
            $s3 = (float) $records[2]->score;
            if ($s1 < $s2 && $s2 < $s3) {
                $isDecreasingTrend = true;
            }
        }

        if ($avgScore < 50.0) {
            return ['sub_status' => self::STATUS_KRITIS, 'trigger' => 'AKADEMIK_RATA_RATA_DIBAWAH_50'];
        }

        if ($avgScore < 65.0 || $isDecreasingTrend) {
            return [
                'sub_status' => self::STATUS_WASPADA,
                'trigger' => $isDecreasingTrend ? 'AKADEMIK_TREN_TURUN_BERUNTUN' : 'AKADEMIK_RATA_RATA_DIBAWAH_65',
            ];
        }

        if ($avgScore < 75.0) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'AKADEMIK_RATA_RATA_DIBAWAH_KKM'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    public function evaluateAttendance(Student $student): array
    {
        $thirtyDaysAgo = Carbon::today()->subDays(30);
        $records = $student->attendanceRecords()
            ->where('date', '>=', $thirtyDaysAgo)
            ->orderBy('date', 'desc')
            ->get();

        if ($records->count() === 0) {
            return ['sub_status' => 'PENDING', 'trigger' => null];
        }

        // Hitung Alpa Berturut-turut & Total Alpa
        $consecutiveAlpha = 0;
        foreach ($records as $rec) {
            if ($rec->status === 'ALPA') {
                $consecutiveAlpha++;
            } else {
                break;
            }
        }

        $totalRecords = $records->count();
        $totalAlpa = $records->where('status', 'ALPA')->count();
        $presentCount = $records->whereIn('status', ['HADIR', 'TERLAMBAT'])->count();
        $rate = ($presentCount / $totalRecords) * 100;

        if ($consecutiveAlpha > 5 || $totalAlpa >= 5 || $rate < 80.0) {
            return [
                'sub_status' => self::STATUS_KRITIS,
                'trigger' => $consecutiveAlpha > 5 ? 'ALPA_LEBIH_DARI_5_HARI' : ($totalAlpa >= 5 ? 'TOTAL_ALPA_5_HARI' : 'KEHADIRAN_DIBAWAH_80_PERSEN'),
            ];
        }

        if ($consecutiveAlpha >= 3 || $totalAlpa >= 3 || $rate < 90.0) {
            return [
                'sub_status' => self::STATUS_WASPADA,
                'trigger' => $consecutiveAlpha >= 3 ? 'ALPA_3_SAMPAI_5_HARI' : ($totalAlpa >= 3 ? 'TOTAL_ALPA_3_HARI' : 'KEHADIRAN_DIBAWAH_90_PERSEN'),
            ];
        }

        if ($consecutiveAlpha >= 1 || $totalAlpa >= 1 || $rate < 95.0) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'ALPA_TERCATAT'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    public function evaluateBehavior(Student $student): array
    {
        $sixMonthsAgo = Carbon::today()->subMonths(6);
        $observations = $student->behaviorObservations()
            ->where('date', '>=', $sixMonthsAgo)
            ->get();

        if ($observations->count() === 0) {
            return ['sub_status' => 'PENDING', 'trigger' => null];
        }

        $negativeObservations = $observations->whereNotIn('category', ['PERILAKU_POSITIF', 'PROSOSIAL']);
        $beratCount = $negativeObservations->where('severity', 'BERAT')->count();
        $sedangCount = $negativeObservations->where('severity', 'SEDANG')->count();
        $ringanCount = $negativeObservations->where('severity', 'RINGAN')->count();

        if ($beratCount >= 1 || $sedangCount >= 2 || $ringanCount > 5) {
            return ['sub_status' => self::STATUS_KRITIS, 'trigger' => 'PERILAKU_PELANGGARAN_BERAT_ATAU_BERULANG'];
        }

        if ($sedangCount >= 1 || $ringanCount >= 3) {
            return ['sub_status' => self::STATUS_WASPADA, 'trigger' => 'PERILAKU_PELANGGARAN_SEDANG'];
        }

        if ($ringanCount >= 1) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'PERILAKU_PELANGGARAN_RINGAN'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    public function evaluateBkCases(Student $student): array
    {
        $activeCases = $student->bkCases()
            ->whereIn('status', ['BARU_DILAPORKAN', 'DALAM_PROSES', 'DIESKALASI_KE_KEPSEK'])
            ->get();

        if ($activeCases->contains('severity', 'BERAT') || $activeCases->contains('status', 'DIESKALASI_KE_KEPSEK')) {
            return ['sub_status' => self::STATUS_KRITIS, 'trigger' => 'BK_KASUS_BERAT_ATAU_DIESKALASI'];
        }

        if ($activeCases->contains('severity', 'SEDANG') || $activeCases->where('severity', 'RINGAN')->count() >= 2) {
            return ['sub_status' => self::STATUS_WASPADA, 'trigger' => 'BK_KASUS_SEDANG_AKTIF'];
        }

        if ($activeCases->where('severity', 'RINGAN')->count() === 1) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'BK_KASUS_RINGAN_AKTIF'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    private function persistScore(Student $student, string $finalStatus, array $detail): EwsScore
    {
        return DB::transaction(function () use ($student, $finalStatus, $detail) {
            $existing = EwsScore::where('student_id', $student->id)->first();
            $oldStatus = $existing ? $existing->status : 'BELUM_ADA';

            $score = EwsScore::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'status' => $finalStatus,
                    'academic_sub_status' => $detail['academic'],
                    'attendance_sub_status' => $detail['attendance'],
                    'behavior_sub_status' => $detail['behavior'],
                    'bk_sub_status' => $detail['bk'],
                    'triggered_by_parameters' => $detail['triggers'],
                    'calculated_at' => Carbon::now(),
                ]
            );

            if ($oldStatus !== $finalStatus) {
                EwsScoreHistory::create([
                    'student_id' => $student->id,
                    'old_status' => $oldStatus,
                    'new_status' => $finalStatus,
                    'trigger_reasons' => $detail['triggers'],
                    'recorded_at' => Carbon::now(),
                ]);
            }

            return $score;
        });
    }
}
