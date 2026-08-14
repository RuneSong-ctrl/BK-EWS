<?php

namespace Tests\Unit;

use App\Models\AcademicRecord;
use App\Models\AttendanceRecord;
use App\Models\BkCase;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use App\Services\Ews\EwsScoringService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EwsScoringServiceTest extends TestCase
{
    use RefreshDatabase;

    protected EwsScoringService $scoringService;
    protected User $teacher;
    protected User $bk;
    protected Subject $subject;

    protected function setUp(): void
    {
        parent::setUp();
        $this->scoringService = new EwsScoringService();

        $this->teacher = User::factory()->create(['role' => 'guru_kelas']);
        $this->bk = User::factory()->create(['role' => 'guru_bk']);
        $this->subject = Subject::create([
            'code' => 'MAT',
            'name' => 'Matematika',
            'passing_grade' => 75.00,
        ]);
    }

    public function test_student_with_incomplete_data_returns_data_belum_lengkap(): void
    {
        $student = Student::create([
            'nis' => 'TEST01',
            'nisn' => 'NISN01',
            'name' => 'Siswa Baru',
            'gender' => 'L',
        ]);

        // Hanya 1 nilai akademik (kuota min: 2) dan 1 hari absen (kuota min: 5)
        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $this->subject->id,
            'assessment_type' => 'UH',
            'period' => 'Semester 1',
            'academic_year' => '2026/2027',
            'score' => 85.00,
            'created_by' => $this->teacher->id,
        ]);

        $score = $this->scoringService->evaluate($student);

        $this->assertEquals(EwsScoringService::STATUS_DATA_BELUM_LENGKAP, $score->status);
    }

    public function test_student_with_consecutive_alpha_greater_than_5_triggers_kritis(): void
    {
        $student = Student::create([
            'nis' => 'TEST02',
            'nisn' => 'NISN02',
            'name' => 'Siswa Alpa Kronis',
            'gender' => 'L',
        ]);

        // 6 hari alpa beruntun
        for ($i = 6; $i >= 1; $i--) {
            AttendanceRecord::create([
                'student_id' => $student->id,
                'date' => Carbon::today()->subDays($i)->toDateString(),
                'status' => 'ALPA',
                'created_by' => $this->teacher->id,
            ]);
        }

        $score = $this->scoringService->evaluate($student);

        $this->assertEquals(EwsScoringService::STATUS_KRITIS, $score->status);
        $this->assertContains('ALPA_LEBIH_DARI_5_HARI', $score->triggered_by_parameters);
    }

    public function test_student_with_good_grades_but_critical_bk_case_evaluates_to_kritis_immediately(): void
    {
        $student = Student::create([
            'nis' => 'TEST03',
            'nisn' => 'NISN03',
            'name' => 'Siswa Kasus Berat',
            'gender' => 'L',
        ]);

        // Nilai bagus
        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $this->subject->id,
            'assessment_type' => 'UH',
            'period' => 'Smt 1',
            'academic_year' => '2026/2027',
            'score' => 95.00,
            'created_by' => $this->teacher->id,
        ]);
        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $this->subject->id,
            'assessment_type' => 'UTS',
            'period' => 'Smt 1',
            'academic_year' => '2026/2027',
            'score' => 90.00,
            'created_by' => $this->teacher->id,
        ]);

        // Kasus BK Berat
        BkCase::create([
            'student_id' => $student->id,
            'incident_date' => Carbon::today(),
            'reported_date' => Carbon::today(),
            'case_types' => ['KEKERASAN_FISIK'],
            'severity' => 'BERAT',
            'status' => 'DIESKALASI_KE_KEPSEK',
            'follow_up_actions' => ['PANGGILAN_ORANG_TUA'],
            'handled_by' => $this->bk->id,
        ]);

        $score = $this->scoringService->evaluate($student);

        $this->assertEquals(EwsScoringService::STATUS_KRITIS, $score->status);
        $this->assertContains('BK_KASUS_BERAT_ATAU_DIESKALASI', $score->triggered_by_parameters);
    }

    public function test_student_with_decreasing_academic_trend_evaluates_to_waspada(): void
    {
        $student = Student::create([
            'nis' => 'TEST04',
            'nisn' => 'NISN04',
            'name' => 'Siswa Tren Menurun',
            'gender' => 'P',
        ]);

        // 3 periode nilai menurun: 55 (terbaru) < 68 < 82 (terlama)
        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $this->subject->id,
            'assessment_type' => 'UH',
            'period' => 'UH 3',
            'academic_year' => '2026/2027',
            'score' => 55.00,
            'created_by' => $this->teacher->id,
            'created_at' => Carbon::now(),
        ]);
        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $this->subject->id,
            'assessment_type' => 'UH',
            'period' => 'UH 2',
            'academic_year' => '2026/2027',
            'score' => 68.00,
            'created_by' => $this->teacher->id,
            'created_at' => Carbon::now()->subDays(10),
        ]);
        AcademicRecord::create([
            'student_id' => $student->id,
            'subject_id' => $this->subject->id,
            'assessment_type' => 'UH',
            'period' => 'UH 1',
            'academic_year' => '2026/2027',
            'score' => 82.00,
            'created_by' => $this->teacher->id,
            'created_at' => Carbon::now()->subDays(20),
        ]);

        // Kehadiran cukup (5 hari hadir)
        for ($i = 5; $i >= 1; $i--) {
            AttendanceRecord::create([
                'student_id' => $student->id,
                'date' => Carbon::today()->subDays($i)->toDateString(),
                'status' => 'HADIR',
                'created_by' => $this->teacher->id,
            ]);
        }

        $score = $this->scoringService->evaluate($student);

        $this->assertEquals(EwsScoringService::STATUS_WASPADA, $score->status);
    }
}
