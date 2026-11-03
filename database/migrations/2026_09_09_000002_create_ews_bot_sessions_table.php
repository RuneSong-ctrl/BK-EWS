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
        Schema::create('ews_bot_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_name', 50)->default('primary_ews_bot')->unique();
            $table->string('phone_number', 50)->nullable();
            $table->enum('status', ['connected', 'qr_ready', 'disconnected'])->default('disconnected');
            $table->text('qr_code_payload')->nullable();
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ews_bot_sessions');
    }
};
