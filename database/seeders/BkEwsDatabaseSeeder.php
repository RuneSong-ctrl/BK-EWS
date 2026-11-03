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
        // 1. Akun Pendidik & Administrator Resmi Sekolah
        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'nip' => '199001012015011001',
                'name' => 'Operator IT / Admin Sistem',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        $guruBudi = User::updateOrCreate(
            ['nip' => '198501152010011005'],
            [
                'email' => 'guru1@gmail.com',
                'name' => 'Budi Santoso, S.Pd.',
                'password' => Hash::make('password'),
                'role' => 'guru_kelas',
            ]
        );

        $guruSiti = User::updateOrCreate(
            ['nip' => '198803202012022003'],
            [
                'email' => 'guru2@gmail.com',
                'name' => 'Siti Aminah, S.Pd.',
                'password' => Hash::make('password'),
                'role' => 'guru_kelas',
            ]
        );

        $guruBk = User::updateOrCreate(
            ['nip' => '198207102008012009'],
            [
                'email' => 'bk@gmail.com',
                'name' => 'Rahmawati, S.Pd., M.Psi.',
                'password' => Hash::make('password'),
                'role' => 'guru_bk',
            ]
        );

        $kepsek = User::updateOrCreate(
            ['nip' => '197005121995031002'],
            [
                'email' => 'kepsek@gmail.com',
                'name' => 'Drs. H. Hartono, M.Pd.',
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

        // Kelas & siswa dibuat otomatis dari data Moodle oleh Ews2TierSeeder (EwsIngestionService)
    }
}

