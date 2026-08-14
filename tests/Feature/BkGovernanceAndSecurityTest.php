<?php

namespace Tests\Feature;

use App\Models\BehaviorObservation;
use App\Models\BkCase;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BkGovernanceAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $guruKelas;
    protected User $guruBk;
    protected User $kepsek;
    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guruKelas = User::factory()->create(['role' => 'guru_kelas']);
        $this->guruBk = User::factory()->create(['role' => 'guru_bk']);
        $this->kepsek = User::factory()->create(['role' => 'kepsek']);

        $this->student = Student::create([
            'nis' => 'SEC001',
            'nisn' => 'NISNSEC001',
            'name' => 'Siswa Uji Keamanan',
            'gender' => 'L',
        ]);
    }

    public function test_guru_bk_can_see_all_bk_cases(): void
    {
        BkCase::create([
            'student_id' => $this->student->id,
            'incident_date' => Carbon::today(),
            'reported_date' => Carbon::today(),
            'case_types' => ['TATA_TERTIB'],
            'severity' => 'RINGAN',
            'status' => 'BARU_DILAPORKAN',
            'follow_up_actions' => ['TEGURAN_LISAN'],
            'handled_by' => $this->guruBk->id,
        ]);

        $cases = BkCase::accessibleBy($this->guruBk)->get();

        $this->assertCount(1, $cases);
    }

    public function test_kepsek_cannot_view_light_non_escalated_bk_cases(): void
    {
        // Kasus Ringan, tidak dieskalasi, siswa bukan status kritis/waspada
        BkCase::create([
            'student_id' => $this->student->id,
            'incident_date' => Carbon::today(),
            'reported_date' => Carbon::today(),
            'case_types' => ['TATA_TERTIB'],
            'severity' => 'RINGAN',
            'status' => 'BARU_DILAPORKAN',
            'follow_up_actions' => ['TEGURAN_LISAN'],
            'handled_by' => $this->guruBk->id,
        ]);

        $casesForKepsek = BkCase::accessibleBy($this->kepsek)->get();

        $this->assertCount(0, $casesForKepsek);
    }

    public function test_kepsek_can_view_severe_or_escalated_cases(): void
    {
        BkCase::create([
            'student_id' => $this->student->id,
            'incident_date' => Carbon::today(),
            'reported_date' => Carbon::today(),
            'case_types' => ['KEKERASAN_FISIK'],
            'severity' => 'BERAT',
            'status' => 'DIESKALASI_KE_KEPSEK',
            'follow_up_actions' => ['PANGGILAN_ORANG_TUA'],
            'handled_by' => $this->guruBk->id,
        ]);

        $casesForKepsek = BkCase::accessibleBy($this->kepsek)->get();

        $this->assertCount(1, $casesForKepsek);
    }

    public function test_guru_kelas_cannot_access_bk_cases_directly(): void
    {
        BkCase::create([
            'student_id' => $this->student->id,
            'incident_date' => Carbon::today(),
            'reported_date' => Carbon::today(),
            'case_types' => ['KEKERASAN_FISIK'],
            'severity' => 'BERAT',
            'status' => 'DIESKALASI_KE_KEPSEK',
            'follow_up_actions' => ['PANGGILAN_ORANG_TUA'],
            'handled_by' => $this->guruBk->id,
        ]);

        $casesForGuruKelas = BkCase::accessibleBy($this->guruKelas)->get();

        $this->assertCount(0, $casesForGuruKelas);
    }

    public function test_raw_behavior_observation_text_is_encrypted_in_database(): void
    {
        $rawText = 'Catatan observasi perilaku sangat sensitif siswa.';

        $obs = BehaviorObservation::create([
            'student_id' => $this->student->id,
            'date' => Carbon::today(),
            'category' => 'MENARIK_DIRI',
            'severity' => 'SEDANG',
            'raw_text' => $rawText,
            'ai_structured_summary' => 'Siswa menarik diri.',
            'confirmed_by' => $this->guruKelas->id,
        ]);

        // Model attribute decryption
        $this->assertEquals($rawText, $obs->raw_text);

        // Direct DB raw check: kolom di DB terenkripsi (tidak sama dengan plain text)
        $rawDbValue = DB::table('behavior_observations')->where('id', $obs->id)->value('raw_text');
        $this->assertNotEquals($rawText, $rawDbValue);
    }
}
