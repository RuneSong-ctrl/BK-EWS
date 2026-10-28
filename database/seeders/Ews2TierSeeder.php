<?php

namespace Database\Seeders;

use App\Models\EwsCounselingJournal;
use App\Models\EwsStudentSummary;
use App\Models\User;
use App\Services\Ews\EwsIngestionService;
use Illuminate\Database\Seeder;

class Ews2TierSeeder extends Seeder
{
    /**
     * Mengisi data EWS 2-Tier dari berkas keluaran run_pipeline.py
     * (default: ../EWS_Moodle/sample_output.json, dapat diubah lewat EWS_OUTPUT_PATH).
     */
    public function run(EwsIngestionService $ingestion): void
    {
        $path = config('services.ews.output');

        if (!is_file($path)) {
            $this->command?->error("File keluaran model tidak ditemukan: {$path}");
            $this->command?->line('Jalankan dulu: python run_pipeline.py --export sample_output.json (di folder EWS_Moodle).');
            return;
        }

        $result = $ingestion->ingestFile($path);
        $this->command?->info(sprintf(
            'EWS model v%s: Tier 1 %d baru/%d diperbarui, Tier 2 %d baru/%d diperbarui.',
            $result['versi_model'] ?? '-',
            $result['tier1']['created'], $result['tier1']['updated'],
            $result['tier2']['created'], $result['tier2']['updated']
        ));

        // Satu contoh jurnal konseling untuk siswa prioritas tertinggi agar alur Guru BK dapat didemokan
        $guruBk = User::where('role', 'guru_bk')->first();
        $summary = EwsStudentSummary::with('student')
            ->where('prioritas_konseling', 'TINGGI')
            ->orderByDesc('total_mapel_berisiko')
            ->orderByDesc('inaktivitas_terlama_hari')
            ->first();

        if ($guruBk && $summary && !EwsCounselingJournal::where('summary_id', $summary->id)->exists()) {
            EwsCounselingJournal::create([
                'summary_id' => $summary->id,
                'guru_bk_id' => $guruBk->id,
                'jenis_layanan' => 'konseling_individu',
                'catatan_konseling' => 'Siswa dipanggil untuk sesi bimbingan individual terkait peringatan EWS di beberapa mata pelajaran. '
                    . 'Siswa menyampaikan kesulitan membagi waktu sehingga beberapa tugas Moodle terlewat.',
                'rencana_tindak_lanjut' => 'Menyusun jadwal belajar mandiri, konfirmasi tugas susulan ke guru mapel terkait, '
                    . 'dan pemantauan ulang aktivitas Moodle satu minggu ke depan.',
                'evaluasi_perilaku' => 'tetap',
                'tanggal_monitoring_berikutnya' => now()->addDays(7)->toDateString(),
            ]);
            $summary->update(['status_penanganan' => 'in_counseling']);
        }
    }
}
