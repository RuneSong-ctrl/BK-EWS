<?php

namespace Database\Seeders;

use App\Models\ClassEnrollment;
use App\Models\EwsCounselingJournal;
use App\Models\EwsCourseAlert;
use App\Models\EwsStudentSummary;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class Ews2TierSeeder extends Seeder
{
    public function run(): void
    {
        // Temukan file sample_output.json
        $jsonPaths = [
            base_path('../Model-BK-Ews/sample_output.json'),
            'c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/sample_output.json',
            base_path('sample_output.json'),
        ];

        $jsonPath = null;
        foreach ($jsonPaths as $path) {
            if (File::exists($path)) {
                $jsonPath = $path;
                break;
            }
        }

        if (!$jsonPath) {
            $this->command->error("File sample_output.json tidak ditemukan!");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        if (!$data) {
            $this->command->error("Format JSON tidak valid di {$jsonPath}");
            return;
        }

        $guruBk = User::where('role', 'guru_bk')->first() ?? User::first();
        $guruMapel = User::where('role', 'guru_kelas')->first() ?? User::first();

        // 1. Ingestion Tier 1: Alert Guru Mata Pelajaran
        $studentMap = []; // id_siswa -> Student model
        if (!empty($data['tier1_subject_teacher'])) {
            foreach ($data['tier1_subject_teacher'] as $item) {
                $idSiswa = $item['id_siswa'];
                $namaSiswa = $item['nama_siswa'] ?? 'Siswa ' . $idSiswa;
                $kelasNama = $item['kelas'] ?? 'X-RPL-1';

                // Pastikan Rombel Kelas ada
                $schoolClass = SchoolClass::firstOrCreate(
                    ['name' => $kelasNama],
                    [
                        'grade_level' => 10,
                        'homeroom_teacher_id' => $guruMapel->id,
                        'academic_year' => '2026/2027',
                    ]
                );

                // Pastikan Siswa ada di database
                if (!isset($studentMap[$idSiswa])) {
                    $student = Student::updateOrCreate(
                        ['nis' => (string) $idSiswa],
                        [
                            'nisn' => '008' . str_pad($idSiswa, 7, '0', STR_PAD_LEFT),
                            'name' => $namaSiswa,
                            'gender' => str_contains(strtolower($namaSiswa), 'citra') ? 'P' : 'L',
                            'status' => 'AKTIF',
                        ]
                    );

                    ClassEnrollment::updateOrCreate(
                        ['student_id' => $student->id, 'academic_year' => '2026/2027'],
                        [
                            'class_id' => $schoolClass->id,
                            'is_current' => true,
                        ]
                    );

                    $studentMap[$idSiswa] = $student;
                }

                $student = $studentMap[$idSiswa];
                $m24 = $item['metrik_24_fitur_model'] ?? [];

                EwsCourseAlert::updateOrCreate(
                    [
                        'siswa_id' => $student->id,
                        'kode_modul' => $item['mata_pelajaran']['kode_modul'],
                    ],
                    [
                        'nama_mapel' => $item['mata_pelajaran']['nama_mapel'],
                        'kategori_mapel' => $item['mata_pelajaran']['kategori'],
                        'guru_pengampu' => $item['mata_pelajaran']['guru_pengampu'],
                        'kkm' => (int) ($item['mata_pelajaran']['kkm'] ?? 75),
                        'tingkat_risiko' => $item['analisis_risiko']['tingkat_risiko'],
                        'probabilitas_risiko' => (float) $item['analisis_risiko']['probabilitas_risiko'],
                        'durasi_belajar_jam' => (float) ($m24['engagement_dan_durasi']['course_duration_hours'] ?? 0.0),
                        'lesson_attempts' => (int) ($m24['aktivitas_lesson']['lesson_attempts_count'] ?? 0),
                        'rasio_ketuntasan_lesson' => (float) ($m24['aktivitas_lesson']['lesson_completion_ratio'] ?? 0.0),
                        'nilai_rata_rata_lesson' => (float) ($m24['aktivitas_lesson']['lesson_avg_score'] ?? 0.0),
                        'tugas_belum_dikumpul' => (int) ($m24['kepatuhan_tugas']['missing_assignments'] ?? 0),
                        'tugas_terlambat' => (int) ($m24['kepatuhan_tugas']['late_submission_count'] ?? 0),
                        'nilai_rata_rata_tugas' => (float) ($m24['akademik']['avg_score'] ?? 0.0),
                        'metrik_24_fitur_model' => $m24,
                        'faktor_pemicu' => $item['faktor_pemicu'] ?? [],
                        'rekomendasi_tindakan' => $item['rekomendasi_tindakan'] ?? '',
                        'status' => ($item['analisis_risiko']['tingkat_risiko'] === 'TINGGI' && $idSiswa === 65002) ? 'konfirmasi_tugas' : 'pending',
                        'catatan_guru_mapel' => ($idSiswa === 65002) ? 'Sudah diingatkan di kelas untuk mengumpulkan kuis modul AAA sebelum Jumat.' : null,
                    ]
                );
            }
        }

        // 2. Ingestion Tier 2: Rekapitulasi Karakter Belajar Guru BK
        if (!empty($data['tier2_counselor_bk'])) {
            foreach ($data['tier2_counselor_bk'] as $item) {
                $idSiswa = $item['id_siswa'];
                $student = $studentMap[$idSiswa] ?? Student::where('nis', (string) $idSiswa)->first();

                if (!$student) {
                    continue;
                }

                $rekap = $item['rekapitulasi_semester'] ?? [];

                $summary = EwsStudentSummary::updateOrCreate(
                    ['siswa_id' => $student->id],
                    [
                        'total_mapel_diambil' => (int) ($rekap['total_mapel_diambil'] ?? 0),
                        'total_mapel_berisiko' => (int) ($rekap['total_mapel_berisiko'] ?? 0),
                        'total_jam_belajar' => (float) ($rekap['total_jam_belajar'] ?? 0.0),
                        'total_tugas_belum_dikumpul' => (int) ($rekap['total_tugas_belum_dikumpul'] ?? 0),
                        'total_tugas_terlambat' => (int) ($rekap['total_tugas_terlambat'] ?? 0),
                        'inaktivitas_terlama_hari' => (int) ($rekap['inaktivitas_terlama_hari'] ?? 0),
                        'profil_karakter_belajar' => $item['profil_karakter_belajar'] ?? 'Normal',
                        'prioritas_konseling' => $item['prioritas_konseling'] ?? 'RENDAH',
                        'rekomendasi_tindakan' => $item['rekomendasi_tindakan'] ?? '',
                        'rincian_per_mata_pelajaran' => $item['rincian_per_mata_pelajaran'] ?? [],
                        'status_penanganan' => ($item['prioritas_konseling'] === 'TINGGI') ? 'in_counseling' : 'open',
                    ]
                );

                // Buat 1 contoh jurnal konseling resmi untuk Ahmad Fauzan (Prioritas Tinggi)
                if ($idSiswa === 28400 && $guruBk) {
                    EwsCounselingJournal::updateOrCreate(
                        ['summary_id' => $summary->id],
                        [
                            'guru_bk_id' => $guruBk->id,
                            'jenis_layanan' => 'konseling_individu',
                            'catatan_konseling' => 'Siswa dipanggil ke ruang BK untuk sesi bimbingan individual. Ahmad mengakui sering bergadang bermain game online hingga dini hari sehingga terlambat bangun dan melewatkan tenggat waktu tugas modul AAA dan BBB.',
                            'rencana_tindak_lanjut' => 'Menyusun komitmen manajemen waktu belajar mandiri di rumah (target 1 jam/hari), konfirmasi tugas susulan ke guru mapel (Pak Wayan & Bu Rai), serta koordinasi pemantauan dengan orang tua via WhatsApp.',
                            'evaluasi_perilaku' => 'membaik',
                            'tanggal_monitoring_berikutnya' => now()->addDays(7)->toDateString(),
                        ]
                    );
                }
            }
        }
    }
}
