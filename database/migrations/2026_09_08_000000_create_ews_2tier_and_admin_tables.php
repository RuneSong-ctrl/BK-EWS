<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Course Mappings (Kamus Data Eksternal course_mapping.csv)
        Schema::create('course_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('code_module', 20)->unique();
            $table->string('nama_mapel');
            $table->string('kategori_mapel');
            $table->string('nama_guru_mapel');
            $table->string('no_wa_guru', 50)->nullable();
            $table->integer('kkm')->default(75);
            $table->timestamps();
        });

        // 2. Moodle Sync Logs (Audit Riwayat Sinkronisasi Moodle)
        Schema::create('moodle_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('sync_type', ['manual', 'cron'])->default('manual');
            $table->enum('status', ['running', 'success', 'failed'])->default('running');
            $table->integer('students_processed')->default(0);
            $table->text('message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // 3. EWS Course Alerts (Tier 1 — Guru Mata Pelajaran)
        Schema::create('ews_course_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('students')->cascadeOnDelete();
            $table->string('kode_modul', 20);
            $table->string('nama_mapel');
            $table->string('kategori_mapel');
            $table->string('guru_pengampu');
            $table->integer('kkm')->default(75);
            $table->enum('tingkat_risiko', ['TINGGI', 'SEDANG', 'RENDAH']);
            $table->float('probabilitas_risiko', 5, 3);
            $table->float('durasi_belajar_jam', 6, 1)->default(0.0);
            $table->integer('lesson_attempts')->default(0);
            $table->float('rasio_ketuntasan_lesson', 4, 2)->default(0.0);
            $table->float('nilai_rata_rata_lesson', 5, 1)->default(0.0);
            $table->integer('tugas_belum_dikumpul')->default(0);
            $table->integer('tugas_terlambat')->default(0);
            $table->float('nilai_rata_rata_tugas', 5, 1)->default(0.0);
            $table->json('metrik_24_fitur_model');
            $table->json('faktor_pemicu');
            $table->string('rekomendasi_tindakan');
            $table->enum('status', ['pending', 'konfirmasi_tugas', 'remedial', 'selesai'])->default('pending');
            $table->text('catatan_guru_mapel')->nullable();
            $table->timestamps();

            $table->index(['siswa_id', 'kode_modul']);
            $table->index(['tingkat_risiko', 'status']);
        });

        // 4. EWS Student Summaries (Tier 2 — Guru Bimbingan Konseling)
        Schema::create('ews_student_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('students')->cascadeOnDelete();
            $table->integer('total_mapel_diambil')->default(0);
            $table->integer('total_mapel_berisiko')->default(0);
            $table->float('total_jam_belajar', 6, 1)->default(0.0);
            $table->integer('total_tugas_belum_dikumpul')->default(0);
            $table->integer('total_tugas_terlambat')->default(0);
            $table->integer('inaktivitas_terlama_hari')->default(0);
            $table->string('profil_karakter_belajar');
            $table->enum('prioritas_konseling', ['TINGGI', 'SEDANG', 'RENDAH']);
            $table->string('rekomendasi_tindakan');
            $table->json('rincian_per_mata_pelajaran');
            $table->enum('status_penanganan', ['open', 'in_counseling', 'resolved'])->default('open');
            $table->timestamps();

            $table->index(['siswa_id', 'prioritas_konseling']);
            $table->index('prioritas_konseling');
        });

        // 5. EWS Counseling Journals (Jurnal Sesi Konseling & Intervensi BK)
        Schema::create('ews_counseling_journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('summary_id')->constrained('ews_student_summaries')->cascadeOnDelete();
            $table->foreignId('guru_bk_id')->constrained('users')->cascadeOnDelete();
            $table->enum('jenis_layanan', ['konseling_individu', 'pemanggilan_siswa', 'home_visit', 'koordinasi_ortu']);
            $table->text('catatan_konseling');
            $table->text('rencana_tindak_lanjut');
            $table->enum('evaluasi_perilaku', ['membaik', 'tetap', 'memburuk'])->nullable();
            $table->date('tanggal_monitoring_berikutnya')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ews_counseling_journals');
        Schema::dropIfExists('ews_student_summaries');
        Schema::dropIfExists('ews_course_alerts');
        Schema::dropIfExists('moodle_sync_logs');
        Schema::dropIfExists('course_mappings');
    }
};
