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
        // 1. EWS Notifications (Tabel Antrean & Hasil Deteksi Moodle EWS)
        Schema::create('ews_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('moodle_student_id', 50)->index();
            $table->string('student_name', 255);
            $table->string('class_name', 50)->nullable();
            $table->string('course_code', 50);
            $table->string('academic_period', 50);

            // Hasil Prediksi ML Model
            $table->enum('risk_level', ['TINGGI', 'SEDANG', 'RENDAH'])->index();
            $table->decimal('risk_probability', 5, 4);
            $table->string('risk_percentage', 10);
            $table->decimal('decision_threshold', 4, 2)->default(0.40);
            $table->string('intervention_urgency', 255)->nullable();

            // Metrik Perilaku & Faktor Pemicu (Kontrak Data JSON)
            $table->json('moodle_metrics');
            $table->json('risk_factors');

            // AI Narasi & Integrasi Notifikasi WhatsApp
            $table->text('ai_narration')->nullable();
            $table->text('wa_message')->nullable();
            $table->string('audience', 50)->default('guru_bk');
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('target_phone', 30)->nullable();

            // Siklus Status Notifikasi
            $table->enum('status', ['pending', 'generating', 'ready', 'sent', 'failed'])->default('pending')->index();
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['moodle_student_id', 'academic_period']);
        });

        // 2. EWS Interventions (Tindak Lanjut Konseling oleh Guru BK)
        Schema::create('ews_interventions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('ews_notifications')->cascadeOnDelete();
            $table->foreignId('counselor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('bk_case_id')->nullable()->constrained('bk_cases')->nullOnDelete();

            $table->enum('intervention_type', [
                'KONSELING_INDIVIDU',
                'PEMANGGILAN',
                'KONFIRMASI_WALI',
                'HOME_VISIT',
                'SUPERVISI_KEPSEK',
                'DISPOSISI_KEPSEK',
                'LAINNYA',
            ]);
            $table->text('action_notes');
            $table->enum('student_progress', [
                'MEMBAIK',
                'TETAP',
                'MEMBURUK',
                'DALAM_PEMANTAUAN',
            ])->default('DALAM_PEMANTAUAN');
            $table->date('follow_up_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ews_interventions');
        Schema::dropIfExists('ews_notifications');
    }
};
