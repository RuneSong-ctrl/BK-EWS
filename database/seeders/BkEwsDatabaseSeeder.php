<?php

namespace Database\Seeders;

use App\Models\ClassEnrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BkEwsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Pendidik Resmi Sekolah (Wali Kelas, Guru BK, Kepala Sekolah)
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

        // 2. Mata Pelajaran Pokok Sekolah
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

        foreach ($subjectsData as $s) {
            Subject::updateOrCreate(['code' => $s['code']], $s);
        }

        // 3. Kelas & Penugasan Wali Kelas
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

        // 4. Data Siswa Murni (Hanya Nama, NIS, NISN, Gender - TANPA data dummy EWS)
        $studentsData = [
            // Siswa Kelas 10-MIPA-1 (Wali Kelas: Pak Budi)
            ['nis' => '1001', 'nisn' => '0081234001', 'name' => 'Ahmad Rizky Pratama', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1002', 'nisn' => '0081234002', 'name' => 'Dimas Arya Nugroho', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1003', 'nisn' => '0081234003', 'name' => 'Budi Setiawan', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1004', 'nisn' => '0081234004', 'name' => 'Citra Lestari', 'gender' => 'P', 'class' => $class10A],
            ['nis' => '1005', 'nisn' => '0081234005', 'name' => 'Eko Prasetyo', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1006', 'nisn' => '0081234006', 'name' => 'Kevin Maulana', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1007', 'nisn' => '0081234007', 'name' => 'Anisa Rahmawati', 'gender' => 'P', 'class' => $class10A],
            ['nis' => '1008', 'nisn' => '0081234008', 'name' => 'Bagas Ramadhan', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1009', 'nisn' => '0081234009', 'name' => 'Cynthia Dewi', 'gender' => 'P', 'class' => $class10A],
            ['nis' => '1010', 'nisn' => '0081234010', 'name' => 'Dedi Kurniawan', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1011', 'nisn' => '0081234011', 'name' => 'Farhan Maulana', 'gender' => 'L', 'class' => $class10A],
            ['nis' => '1012', 'nisn' => '0081234012', 'name' => 'Indah Kusuma', 'gender' => 'P', 'class' => $class10A],

            // Siswa Kelas 10-MIPA-2 (Wali Kelas: Ibu Siti)
            ['nis' => '1013', 'nisn' => '0081234013', 'name' => 'Hendra Wijaya', 'gender' => 'L', 'class' => $class10B],
            ['nis' => '1014', 'nisn' => '0081234014', 'name' => 'Fajar Nugraha', 'gender' => 'L', 'class' => $class10B],
            ['nis' => '1015', 'nisn' => '0081234015', 'name' => 'Gita Permata Sari', 'gender' => 'P', 'class' => $class10B],
            ['nis' => '1016', 'nisn' => '0081234016', 'name' => 'Jihan Aulia', 'gender' => 'P', 'class' => $class10B],
            ['nis' => '1017', 'nisn' => '0081234017', 'name' => 'Lutfi Hakim', 'gender' => 'L', 'class' => $class10B],
            ['nis' => '1018', 'nisn' => '0081234018', 'name' => 'Maya Sari Dewi', 'gender' => 'P', 'class' => $class10B],
            ['nis' => '1019', 'nisn' => '0081234019', 'name' => 'Nadia Putri', 'gender' => 'P', 'class' => $class10B],
            ['nis' => '1020', 'nisn' => '0081234020', 'name' => 'Omar Faisal', 'gender' => 'L', 'class' => $class10B],
            ['nis' => '1021', 'nisn' => '0081234021', 'name' => 'Putri Ayu Wandira', 'gender' => 'P', 'class' => $class10B],
            ['nis' => '1022', 'nisn' => '0081234022', 'name' => 'Rian Hidayat', 'gender' => 'L', 'class' => $class10B],
            ['nis' => '1023', 'nisn' => '0081234023', 'name' => 'Salsabila Nur', 'gender' => 'P', 'class' => $class10B],

            // Siswa Kelas 11-MIPA-1
            ['nis' => '1024', 'nisn' => '0081234024', 'name' => 'Taufik Ismail', 'gender' => 'L', 'class' => $class11A],
            ['nis' => '1025', 'nisn' => '0081234025', 'name' => 'Wahyu Saputra', 'gender' => 'L', 'class' => $class11A],
        ];

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
        }
    }
}

