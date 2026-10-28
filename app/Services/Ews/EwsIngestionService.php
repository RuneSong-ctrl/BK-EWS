<?php

namespace App\Services\Ews;

use App\Models\ClassEnrollment;
use App\Models\EwsCourseAlert;
use App\Models\EwsStudentSummary;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Service: EwsIngestionService
 *
 * Menyimpan payload JSON hasil modul ML EWS (Tier 1 Guru Mapel dan Tier 2 Guru BK)
 * ke basis data aplikasi. Dipakai bersama oleh endpoint API ingestion, tombol
 * sinkronisasi Admin, dan seeder, sehingga ketiganya menghasilkan data yang sama.
 *
 * Status tindak lanjut yang sudah diisi guru (status alert dan status penanganan BK)
 * tidak ditimpa saat data disinkronkan ulang.
 */
class EwsIngestionService
{
    /** @var array<int, Student> */
    private array $students = [];

    /**
     * Proses berkas JSON keluaran run_pipeline.py (berisi tier1_subject_teacher dan tier2_counselor_bk).
     *
     * @return array{tier1: array{created: int, updated: int}, tier2: array{created: int, updated: int}, versi_model: ?string}
     */
    public function ingestFile(string $path): array
    {
        if (!is_file($path)) {
            throw new \RuntimeException("Berkas keluaran model tidak ditemukan: {$path}");
        }

        $data = json_decode(file_get_contents($path), true);
        if (!is_array($data)) {
            throw new \RuntimeException("Format JSON tidak valid: {$path}");
        }

        return DB::transaction(fn () => [
            'tier1' => $this->ingestTier1($data['tier1_subject_teacher'] ?? []),
            'tier2' => $this->ingestTier2($data['tier2_counselor_bk'] ?? []),
            'versi_model' => $data['versi_model'] ?? null,
        ]);
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array{created: int, updated: int}
     */
    public function ingestTier1(array $items): array
    {
        $created = 0;
        $updated = 0;

        foreach ($items as $item) {
            if (empty($item['id_siswa'])) {
                continue;
            }

            $student = $this->resolveStudent($item);
            $m24 = $item['metrik_24_fitur_model'] ?? [];
            $mapel = $item['mata_pelajaran'] ?? [];

            $alert = EwsCourseAlert::firstOrNew([
                'siswa_id' => $student->id,
                'kode_modul' => $mapel['kode_modul'] ?? 'AAA',
            ]);

            $alert->fill([
                'nama_mapel' => $mapel['nama_mapel'] ?? 'Mata Pelajaran',
                'kategori_mapel' => $mapel['kategori'] ?? 'Kejuruan/Produktif',
                'guru_pengampu' => $mapel['guru_pengampu'] ?? 'Guru Mapel',
                'kkm' => (int) ($mapel['kkm'] ?? 75),
                'tingkat_risiko' => $item['analisis_risiko']['tingkat_risiko'] ?? 'RENDAH',
                'probabilitas_risiko' => (float) ($item['analisis_risiko']['probabilitas_risiko'] ?? 0.0),
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
            ]);

            if (!$alert->exists) {
                $alert->status = 'pending';
                $created++;
            } else {
                $updated++;
            }
            $alert->save();
        }

        return ['created' => $created, 'updated' => $updated];
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array{created: int, updated: int}
     */
    public function ingestTier2(array $items): array
    {
        $created = 0;
        $updated = 0;

        foreach ($items as $item) {
            if (empty($item['id_siswa'])) {
                continue;
            }

            $student = $this->resolveStudent($item);
            $rekap = $item['rekapitulasi_semester'] ?? [];
            $prioritas = $item['prioritas_konseling'] ?? 'RENDAH';

            $summary = EwsStudentSummary::firstOrNew(['siswa_id' => $student->id]);
            $summary->fill([
                'total_mapel_diambil' => (int) ($rekap['total_mapel_diambil'] ?? 0),
                'total_mapel_berisiko' => (int) ($rekap['total_mapel_berisiko'] ?? 0),
                'total_jam_belajar' => (float) ($rekap['total_jam_belajar'] ?? 0.0),
                'total_tugas_belum_dikumpul' => (int) ($rekap['total_tugas_belum_dikumpul'] ?? 0),
                'total_tugas_terlambat' => (int) ($rekap['total_tugas_terlambat'] ?? 0),
                'inaktivitas_terlama_hari' => (int) ($rekap['inaktivitas_terlama_hari'] ?? 0),
                'profil_karakter_belajar' => $item['profil_karakter_belajar'] ?? 'Normal',
                'prioritas_konseling' => $prioritas,
                'rekomendasi_tindakan' => $item['rekomendasi_tindakan'] ?? '',
                'rincian_per_mata_pelajaran' => $item['rincian_per_mata_pelajaran'] ?? [],
            ]);

            if (!$summary->exists) {
                $summary->status_penanganan = 'open';
                $created++;
            } else {
                $updated++;
            }
            $summary->save();
        }

        return ['created' => $created, 'updated' => $updated];
    }

    /**
     * Cari atau buat siswa berdasarkan NIS (id_siswa), beserta rombel kelasnya.
     *
     * @param array<string, mixed> $item
     */
    private function resolveStudent(array $item): Student
    {
        $nis = (int) $item['id_siswa'];
        if (isset($this->students[$nis])) {
            return $this->students[$nis];
        }

        $student = Student::firstOrCreate(
            ['nis' => (string) $nis],
            [
                'nisn' => '008' . str_pad((string) $nis, 7, '0', STR_PAD_LEFT),
                'name' => $item['nama_siswa'] ?? "Siswa {$nis}",
                'gender' => str_starts_with($item['nama_siswa'] ?? '', 'Ni ') ? 'P' : 'L',
                'status' => 'AKTIF',
            ]
        );

        if (!empty($item['kelas'])) {
            $waliKelas = User::where('role', 'guru_kelas')->first() ?? User::first();
            $class = SchoolClass::firstOrCreate(
                ['name' => $item['kelas']],
                ['grade_level' => 10, 'homeroom_teacher_id' => $waliKelas?->id, 'academic_year' => '2026/2027']
            );
            ClassEnrollment::updateOrCreate(
                ['student_id' => $student->id, 'academic_year' => '2026/2027'],
                ['class_id' => $class->id, 'is_current' => true]
            );
        }

        return $this->students[$nis] = $student;
    }
}
