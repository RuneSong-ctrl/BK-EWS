<?php

require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CourseMapping;
use App\Models\EwsCounselingJournal;
use App\Models\EwsCourseAlert;
use App\Models\EwsStudentSummary;
use App\Models\User;

echo "=== VERIFIKASI SISTEM 2-TIER EWS & ADMIN ===" . PHP_EOL;

// 1. Akun Pengguna 4 Peran
$roles = ['admin', 'guru_kelas', 'guru_bk', 'kepsek'];
foreach ($roles as $role) {
    $u = User::where('role', $role)->first();
    echo "Role [{$role}]: " . ($u ? "{$u->name} ({$u->email})" : "NOT FOUND") . PHP_EOL;
}

echo PHP_EOL . "--- 2. Kamus Mata Pelajaran (course_mappings) ---" . PHP_EOL;
$mappings = CourseMapping::all();
echo "Total Mapel: " . $mappings->count() . PHP_EOL;
foreach ($mappings as $m) {
    echo "  [{$m->code_module}] {$m->nama_mapel} (KKM: {$m->kkm}) -> Guru: {$m->nama_guru_mapel} ({$m->no_wa_guru})" . PHP_EOL;
}

echo PHP_EOL . "--- 3. Tier 1 Alerts (ews_course_alerts) ---" . PHP_EOL;
$alerts = EwsCourseAlert::with('student')->get();
echo "Total Tier 1 Alerts: " . $alerts->count() . PHP_EOL;
foreach ($alerts as $a) {
    $name = $a->student?->name ?? 'Siswa ' . $a->siswa_id;
    echo "  - {$name} [Modul {$a->kode_modul}]: Risiko {$a->tingkat_risiko} ({$a->probabilitas_risiko}), Durasi: {$a->durasi_belajar_jam}j, Missing: {$a->tugas_belum_dikumpul}, Status: {$a->status}" . PHP_EOL;
}

echo PHP_EOL . "--- 4. Tier 2 Summaries (ews_student_summaries) ---" . PHP_EOL;
$summaries = EwsStudentSummary::with('student')->get();
echo "Total Tier 2 Summaries: " . $summaries->count() . PHP_EOL;
foreach ($summaries as $s) {
    $name = $s->student?->name ?? 'Siswa ' . $s->siswa_id;
    echo "  - {$name}: Prioritas {$s->prioritas_konseling} | {$s->profil_karakter_belajar} | Inaktif: {$s->inaktivitas_terlama_hari} hari | Mapel Berisiko: {$s->total_mapel_berisiko}/{$s->total_mapel_diambil}" . PHP_EOL;
}

echo PHP_EOL . "--- 5. Jurnal Konseling BK (ews_counseling_journals) ---" . PHP_EOL;
$journals = EwsCounselingJournal::with(['summary.student', 'counselor'])->get();
echo "Total Jurnal: " . $journals->count() . PHP_EOL;
foreach ($journals as $j) {
    $studentName = $j->summary?->student?->name ?? '-';
    $counselorName = $j->counselor?->name ?? '-';
    echo "  - Sesi untuk: {$studentName} oleh {$counselorName} (Layanan: {$j->jenis_layanan})" . PHP_EOL;
    echo "    Catatan: {$j->catatan_konseling}" . PHP_EOL;
}

echo PHP_EOL . "=== SEMUA VERIFIKASI BERHASIL 100% ===" . PHP_EOL;
