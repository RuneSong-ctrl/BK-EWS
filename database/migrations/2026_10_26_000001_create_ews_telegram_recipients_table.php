<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penautan penerima notifikasi (dicocokkan lewat recipient_name) ke chat Telegram.
     */
    public function up(): void
    {
        Schema::create('ews_telegram_recipients', function (Blueprint $table) {
            $table->id();
            $table->string('recipient_name', 255)->unique();
            $table->string('link_token', 64)->unique();
            $table->string('chat_id', 32)->nullable();
            $table->string('telegram_username', 64)->nullable();
            $table->timestamp('linked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ews_telegram_recipients');
    }
};
