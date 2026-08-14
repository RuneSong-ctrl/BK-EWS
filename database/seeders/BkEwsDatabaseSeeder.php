<?php

namespace Database\Seeders;

use App\Models\AcademicRecord;
use App\Models\AttendanceRecord;
use App\Models\BehaviorObservation;
use App\Models\BkCase;
use App\Models\ClassEnrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use App\Services\Ai\AiAdvisorService;
use App\Services\Ews\EwsScoringService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BkEwsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Pengguna (3 Role)
        $guruBudi = User::updateOrCreate(
            ['email' => 'guru.budi@sekolah.sch.id'],
            [
                'name' => 'Budi Santoso, S.Pd.',
                'nip' => '198501152010011005',
                'password' => Hash::make('password'),
                'role' => 'guru_kelas',
            ]
        );

        $guruSiti = User::updateOrCreate(
            ['email' => 'guru.siti@sekolah.sch.id'],
            [
                'name' => 'Siti Aminah, S.Pd.',
                'nip' => '198803202012022003',
                'password' => Hash::make('password'),
                'role' => 'guru_kelas',
            ]
        );

        $guruBk = User::updateOrCreate(
            ['email' => 'bk.rahma@sekolah.sch.id'],
            [
                'name' => 'Rahmawati, S.Pd., M.Psi.',
                'nip' => '198207102008012009',
                'password' => Hash::make('password'),
                'role' => 'guru_bk',
            ]
        );

        $kepsek = User::updateOrCreate(
            ['email' => 'kepsek.hartono@sekolah.sch.id'],
            [
                'name' => 'Drs. H. Hartono, M.Pd.',
                'nip' => '197005121995031002',
                'password' => Hash::make('password'),
                'role' => 'kepsek',
            ]
        );

        // 2. Buat Mata Pelajaran
        $subjectsData = [
            ['code' => 'MAT-WJB', 'name' => 'Matematika Wajib', 'passing_grade' => 75.00],
            ['code' => 'BINDO', 'name' => 'Bahasa Indonesia', 'passing_grade' => 75.00],
            ['code' => 'BING', 'name' => 'Bahasa Inggris', 'passing_grade' => 75.00],
            ['code' => 'FIS', 'name' => 'Fisika', 'passing_grade' => 75.00],
            ['code' => 'KIM', 'name' => 'Kimia', 'passing_grade' => 75.00],
            ['code' => 'BIO', 'name' => 'Biologi', 'passing_grade' => 75.00],
            ['code' => 'SEJ-INA', 'name' => 'Sejarah Indonesia', 'passing_grade' => 75.00],
            ['code' => 'SOS', 'name' => 'Sosiologi', 'passing_grade' => 75.00],
        ];

        $subjects = [];
        foreach ($subjectsData as $s) {
            $subjects[$s['code']] = Subject::updateOrCreate(['code' => $s['code']], $s);
        }

        // 3. Buat Kelas
        $class10A = SchoolClass::updateOrCreate(
            ['name' => '10-MIPA-1'],
            [
                'grade_level' => 10,
                'homeroom_teacher_id' => $guruBudi->id,
                'academic_year' => '2026/2027',
            ]
        );

        $class10B = SchoolClass::updateOrCreate(
            ['name' => '10-MIPA-2'],
            [
                'grade_level' => 10,
                'homeroom_teacher_id' => $guruSiti->id,
                'academic_year' => '2026/2027',
            ]
        );

        $class11A = SchoolClass::updateOrCreate(
            ['name' => '11-MIPA-1'],
            [
                'grade_level' => 11,
                'homeroom_teacher_id' => $guruBudi->id,
                'academic_year' => '2026/2027',
            ]
        );

        // 4. Data Siswa
        $studentsData = [
            // --- KRITIS ---
            ['nis' => '1001', 'nisn' => '0081234001', 'name' => 'Ahmad Rizky Pratama', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'kritis_alpha'],
            ['nis' => '1002', 'nisn' => '0081234002', 'name' => 'Dimas Arya Nugroho', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'kritis_bk_berat'],
            ['nis' => '1003', 'nisn' => '0081234003', 'name' => 'Hendra Wijaya', 'gender' => 'L', 'class' => $class10B, 'scenario' => 'kritis_akademik'],

            // --- WASPADA ---
            ['nis' => '1004', 'nisn' => '0081234004', 'name' => 'Budi Setiawan', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'waspada_trend_turun'],
            ['nis' => '1005', 'nisn' => '0081234005', 'name' => 'Citra Lestari', 'gender' => 'P', 'class' => $class10A, 'scenario' => 'waspada_alpha_3'],
            ['nis' => '1006', 'nisn' => '0081234006', 'name' => 'Fajar Nugraha', 'gender' => 'L', 'class' => $class10B, 'scenario' => 'waspada_bk_sedang'],

            // --- BERISIKO ---
            ['nis' => '1007', 'nisn' => '0081234007', 'name' => 'Eko Prasetyo', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'berisiko_nilai_kkm'],
            ['nis' => '1008', 'nisn' => '0081234008', 'name' => 'Gita Permata Sari', 'gender' => 'P', 'class' => $class10B, 'scenario' => 'berisiko_perilaku_ringan'],
            ['nis' => '1009', 'nisn' => '0081234009', 'name' => 'Kevin Maulana', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'berisiko_bk_ringan'],

            // --- NORMAL ---
            ['nis' => '1010', 'nisn' => '0081234010', 'name' => 'Anisa Rahmawati', 'gender' => 'P', 'class' => $class10A, 'scenario' => 'normal'],
            ['nis' => '1011', 'nisn' => '0081234011', 'name' => 'Bagas Ramadhan', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'normal'],
            ['nis' => '1012', 'nisn' => '0081234012', 'name' => 'Cynthia Dewi', 'gender' => 'P', 'class' => $class10A, 'scenario' => 'normal'],
            ['nis' => '1013', 'nisn' => '0081234013', 'name' => 'Dedi Kurniawan', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'normal'],
            ['nis' => '1014', 'nisn' => '0081234014', 'name' => 'Farhan Maulana', 'gender' => 'L', 'class' => $class10A, 'scenario' => 'normal'],
            ['nis' => '1015', 'nisn' => '0081234015', 'name' => 'Indah Kusuma', 'gender' => 'P', 'class' => $class10A, 'scenario' => 'normal'],
            ['nis' => '1016', 'nisn' => '0081234016', 'name' => 'Jihan Aulia', 'gender' => 'P', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1017', 'nisn' => '0081234017', 'name' => 'Lutfi Hakim', 'gender' => 'L', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1018', 'nisn' => '0081234018', 'name' => 'Maya Sari Dewi', 'gender' => 'P', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1019', 'nisn' => '0081234019', 'name' => 'Nadia Putri', 'gender' => 'P', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1020', 'nisn' => '0081234020', 'name' => 'Omar Faisal', 'gender' => 'L', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1021', 'nisn' => '0081234021', 'name' => 'Putri Ayu Wandira', 'gender' => 'P', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1022', 'nisn' => '0081234022', 'name' => 'Rian Hidayat', 'gender' => 'L', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1023', 'nisn' => '0081234023', 'name' => 'Salsabila Nur', 'gender' => 'P', 'class' => $class10B, 'scenario' => 'normal'],
            ['nis' => '1024', 'nisn' => '0081234024', 'name' => 'Taufik Ismail', 'gender' => 'L', 'class' => $class11A, 'scenario' => 'normal'],
            ['nis' => '1025', 'nisn' => '0081234025', 'name' => 'Wahyu Saputra', 'gender' => 'L', 'class' => $class11A, 'scenario' => 'normal'],

            // --- DATA BELUM LENGKAP ---
            ['nis' => '1026', 'nisn' => '0081234026', 'name' => 'Yuni Astuti (Siswa Baru)', 'gender' => 'P', 'class' => $class10A, 'scenario' => 'incomplete_data'],
            ['nis' => '1027', 'nisn' => '0081234027', 'name' => 'Zaki Firmansyah (Siswa Baru)', 'gender' => 'L', 'class' => $class10B, 'scenario' => 'incomplete_data'],
        ];

        $scoringService = app(EwsScoringService::class);
        $advisorService = app(AiAdvisorService::class);

        foreach ($studentsData as $item) {
            $student = Student::updateOrCreate(
                ['nis' => $item['nis']],
                [
                    'nisn' => $item['nisn'],
                    'name' => $item['name'],
                    'gender' => $item['gender'],
                    'status' => 'AKTIF',
                ]
            );

            ClassEnrollment::updateOrCreate(
                ['student_id' => $student->id, 'academic_year' => '2026/2027'],
                [
                    'class_id' => $item['class']->id,
                    'is_current' => true,
                ]
            );

            // Generate Data Sesuai Skenario
            $this->seedStudentRecords($student, $item['scenario'], $subjects, $guruBudi, $guruBk);

            // Hitung Skor EWS
            $score = $scoringService->evaluate($student);

            // Generate AI Advisor jika Waspada / Kritis
            if (in_array($score->status, ['WASPADA', 'KRITIS'])) {
                $advisorService->generateAnalysis($student);
            }
        }
    }

    private function seedStudentRecords(Student $student, string $scenario, array $subjects, User $teacher, User $bk): void
    {
        $today = Carbon::today();

        if ($scenario === 'incomplete_data') {
            // Hanya 1 nilai dan 2 hari absen
            AcademicRecord::create([
                'student_id' => $student->id,
                'subject_id' => $subjects['MAT-WJB']->id,
                'assessment_type' => 'UH',
                'period' => 'Semester 1 - UH 1',
                'academic_year' => '2026/2027',
                'score' => 80.00,
                'created_by' => $teacher->id,
            ]);

            AttendanceRecord::create([
                'student_id' => $student->id,
                'date' => $today->copy()->subDays(1),
                'status' => 'HADIR',
                'created_by' => $teacher->id,
            ]);
            AttendanceRecord::create([
                'student_id' => $student->id,
                'date' => $today,
                'status' => 'HADIR',
                'created_by' => $teacher->id,
            ]);
            return;
        }

        // 1. Absensi (20 Hari Terakhir)
        for ($i = 20; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i);
            if ($date->isWeekend()) continue;

            $status = 'HADIR';

            if ($scenario === 'kritis_alpha' && $i <= 6) {
                // Alpa 7 hari berturut-turut
                $status = 'ALPA';
            } elseif ($scenario === 'waspada_alpha_3' && $i <= 3) {
                // Alpa 4 hari berturut-turut
                $status = 'ALPA';
            } elseif ($scenario === 'berisiko_perilaku_ringan' && $i === 2) {
                $status = 'ALPA';
            } elseif ($scenario === 'kritis_akademik' && $i % 3 === 0) {
                $status = 'ALPA';
            }

            AttendanceRecord::updateOrCreate(
                ['student_id' => $student->id, 'date' => $date->toDateString()],
                [
                    'status' => $status,
                    'check_in_time' => $status === 'HADIR' ? '07:05:00' : null,
                    'late_minutes' => 0,
                    'created_by' => $teacher->id,
                ]
            );
        }

        // 2. Nilai Akademik
        $scores = match ($scenario) {
            'kritis_akademik' => [42.0, 45.0, 40.0, 48.0],
            'waspada_trend_turun' => [58.0, 68.0, 80.0, 85.0], // Urutan terbaru ke lama: 58 < 68 < 80 (turun!)
            'berisiko_nilai_kkm' => [70.0, 72.0, 69.0, 71.0],
            'kritis_alpha', 'kritis_bk_berat' => [75.0, 78.0, 74.0, 80.0],
            default => [88.0, 85.0, 90.0, 92.0],
        };

        $subjectKeys = ['MAT-WJB', 'BINDO', 'BING', 'FIS'];
        foreach ($subjectKeys as $idx => $sKey) {
            AcademicRecord::create([
                'student_id' => $student->id,
                'subject_id' => $subjects[$sKey]->id,
                'assessment_type' => 'UH',
                'period' => "Semester 1 - UH " . ($idx + 1),
                'academic_year' => '2026/2027',
                'score' => $scores[$idx] ?? 80.0,
                'created_by' => $teacher->id,
                'created_at' => Carbon::now()->subDays(20 - ($idx * 5)),
            ]);
        }

        // 3. Kasus BK & Observasi Sesuai Skenario
        if ($scenario === 'kritis_bk_berat') {
            BkCase::create([
                'student_id' => $student->id,
                'incident_date' => $today->copy()->subDays(2),
                'reported_date' => $today->copy()->subDays(2),
                'case_types' => ['BULLYING', 'KEKERASAN_FISIK'],
                'bullying_role' => 'PELAKU',
                'severity' => 'BERAT',
                'status' => 'DIESKALASI_KE_KEPSEK',
                'follow_up_actions' => ['PANGGILAN_ORANG_TUA', 'SKORSING'],
                'involved_students_count' => 3,
                'confidential_notes' => 'Insiden perkelahian dan perundungan fisik di area kantin belakang sekolah.',
                'handled_by' => $bk->id,
            ]);

            BehaviorObservation::create([
                'student_id' => $student->id,
                'date' => $today->copy()->subDays(2),
                'category' => 'AGRESIF_FISIK',
                'severity' => 'BERAT',
                'raw_text' => 'Memukul teman sekelas di kantin dan membentak petugas keamanan yang melerai.',
                'ai_structured_summary' => 'Tindakan agresif fisik berat dan pelanggaran ketertiban.',
                'confirmed_by' => $teacher->id,
            ]);
        }

        if ($scenario === 'waspada_trend_turun') {
            BehaviorObservation::create([
                'student_id' => $student->id,
                'date' => $today->copy()->subDays(4),
                'category' => 'MENARIK_DIRI',
                'severity' => 'SEDANG',
                'raw_text' => 'Siswa terlihat sangat murung 4 hari terakhir, menolak kerja kelompok dan menyendiri saat istirahat.',
                'ai_structured_summary' => 'Perilaku menarik diri dari interaksi sosial kelas.',
                'confirmed_by' => $teacher->id,
            ]);
        }

        if ($scenario === 'waspada_bk_sedang') {
            BkCase::create([
                'student_id' => $student->id,
                'incident_date' => $today->copy()->subDays(5),
                'reported_date' => $today->copy()->subDays(4),
                'case_types' => ['KONFLIK_SOSIAL', 'TATA_TERTIB'],
                'severity' => 'SEDANG',
                'status' => 'DALAM_PROSES',
                'follow_up_actions' => ['MEDIASI_PEER', 'MONITORING_RUTIN'],
                'involved_students_count' => 2,
                'confidential_notes' => 'Perselisihan non-fisik berkepanjangan dengan anggota kelompok belajar.',
                'handled_by' => $bk->id,
            ]);
        }

        if ($scenario === 'berisiko_bk_ringan') {
            BkCase::create([
                'student_id' => $student->id,
                'incident_date' => $today->copy()->subDays(7),
                'reported_date' => $today->copy()->subDays(7),
                'case_types' => ['TATA_TERTIB'],
                'severity' => 'RINGAN',
                'status' => 'BARU_DILAPORKAN',
                'follow_up_actions' => ['TEGURAN_LISAN'],
                'involved_students_count' => 1,
                'confidential_notes' => 'Pelanggaran seragam dan keterlambatan upacara bendera.',
                'handled_by' => $bk->id,
            ]);
        }
    }
}
