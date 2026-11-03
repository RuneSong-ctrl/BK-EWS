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
        Schema::create('ews_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('alert_id')->nullable()->constrained('ews_course_alerts')->nullOnDelete();
            $table->foreignId('summary_id')->nullable()->constrained('ews_student_summaries')->nullOnDelete();
            $table->enum('recipient_type', ['guru_mapel', 'guru_bk']);
            $table->string('recipient_name', 255);
            $table->string('recipient_phone', 50);
            $table->enum('risk_level', ['TINGGI', 'SEDANG', 'RENDAH'])->default('TINGGI');
            $table->enum('message_type', ['ai_generated', 'template_manual'])->default('ai_generated');
            $table->text('message_text');
            $table->enum('status', ['pending', 'sending', 'sent', 'failed'])->default('pending');
            $table->unsignedInteger('retry_count')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('scheduled_at')->nullable()->useCurrent();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ews_notifications');
    }
};
