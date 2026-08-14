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
        // 1. Classes
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->unsignedTinyInteger('grade_level');
            $table->foreignId('homeroom_teacher_id')->constrained('users')->onDelete('restrict');
            $table->string('academic_year', 20);
            $table->timestamps();
        });

        // 2. Students
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('nis', 50)->unique();
            $table->string('nisn', 50)->unique();
            $table->string('name', 255);
            $table->enum('gender', ['L', 'P']);
            $table->enum('status', ['AKTIF', 'LULUS', 'PINDAH', 'NON_AKTIF'])->default('AKTIF');
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Class Enrollments
        Schema::create('class_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('restrict');
            $table->string('academic_year', 20);
            $table->boolean('is_current')->default(true);
            $table->timestamps();

            $table->unique(['student_id', 'academic_year']);
        });

        // 4. Subjects
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->decimal('passing_grade', 5, 2)->default(75.00);
            $table->timestamps();
        });

        // 5. Academic Records
        Schema::create('academic_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('restrict');
            $table->enum('assessment_type', ['TUGAS', 'UH', 'UTS', 'UAS']);
            $table->string('period', 50);
            $table->string('academic_year', 20);
            $table->decimal('score', 5, 2);
            $table->boolean('is_remedial')->default(false);
            $table->decimal('previous_score', 5, 2)->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->index(['student_id', 'academic_year', 'period']);
        });

        // 6. Attendance Records
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->date('date');
            $table->enum('status', ['HADIR', 'SAKIT', 'IZIN', 'ALPA', 'TERLAMBAT']);
            $table->time('check_in_time')->nullable();
            $table->unsignedSmallInteger('late_minutes')->default(0);
            $table->string('notes', 255)->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->unique(['student_id', 'date']);
            $table->index(['date', 'status']);
        });

        // 7. Behavior Observations (raw_text encrypted via model)
        Schema::create('behavior_observations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->date('date');
            $table->enum('category', [
                'MENARIK_DIRI',
                'AGRESIF_FISIK',
                'AGRESIF_VERBAL',
                'TIDAK_FOKUS',
                'PELANGGARAN_ATURAN',
                'PERILAKU_POSITIF',
            ]);
            $table->enum('severity', ['RINGAN', 'SEDANG', 'BERAT'])->default('RINGAN');
            $table->text('raw_text');
            $table->string('ai_structured_summary', 255);
            $table->foreignId('confirmed_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->index(['student_id', 'date', 'severity']);
        });

        // 8. BK Cases (confidential_notes encrypted via model)
        Schema::create('bk_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->date('incident_date');
            $table->date('reported_date');
            $table->json('case_types');
            $table->enum('bullying_role', ['KORBAN', 'PELAKU', 'SAKSI'])->nullable();
            $table->enum('severity', ['RINGAN', 'SEDANG', 'BERAT'])->default('RINGAN');
            $table->enum('status', [
                'BARU_DILAPORKAN',
                'DALAM_PROSES',
                'DIESKALASI_KE_KEPSEK',
                'DIRUJUK_EKSTERNAL',
                'SELESAI',
            ])->default('BARU_DILAPORKAN');
            $table->json('follow_up_actions');
            $table->unsignedSmallInteger('involved_students_count')->default(1);
            $table->text('confidential_notes')->nullable();
            $table->foreignId('handled_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->index(['severity', 'status']);
        });

        // 9. EWS Scores
        Schema::create('ews_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->unique()->constrained('students')->onDelete('cascade');
            $table->enum('status', [
                'DATA_BELUM_LENGKAP',
                'NORMAL',
                'BERISIKO',
                'WASPADA',
                'KRITIS',
            ])->default('DATA_BELUM_LENGKAP');
            $table->enum('academic_sub_status', ['NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING'])->default('PENDING');
            $table->enum('attendance_sub_status', ['NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING'])->default('PENDING');
            $table->enum('behavior_sub_status', ['NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING'])->default('PENDING');
            $table->enum('bk_sub_status', ['NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING'])->default('PENDING');
            $table->json('triggered_by_parameters');
            $table->timestamp('calculated_at');
            $table->timestamps();
        });

        // 10. EWS Score History
        Schema::create('ews_score_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('old_status', 50);
            $table->string('new_status', 50);
            $table->json('trigger_reasons');
            $table->timestamp('recorded_at')->useCurrent();

            $table->index(['student_id', 'recorded_at']);
        });

        // 11. AI Analysis Logs
        Schema::create('ai_analysis_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('ews_score_id')->constrained('ews_scores')->onDelete('cascade');
            $table->text('risk_overview');
            $table->json('primary_concerns');
            $table->json('recommendations');
            $table->text('data_limitation_note')->nullable();
            $table->string('model_version', 50);
            $table->timestamp('generated_at')->useCurrent();

            $table->index(['student_id', 'generated_at']);
        });

        // 12. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->string('action', 100);
            $table->string('target_resource', 100);
            $table->string('resource_id', 100);
            $table->string('ip_address', 45);
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('ai_analysis_logs');
        Schema::dropIfExists('ews_score_history');
        Schema::dropIfExists('ews_scores');
        Schema::dropIfExists('bk_cases');
        Schema::dropIfExists('behavior_observations');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('academic_records');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('class_enrollments');
        Schema::dropIfExists('students');
        Schema::dropIfExists('classes');
    }
};
