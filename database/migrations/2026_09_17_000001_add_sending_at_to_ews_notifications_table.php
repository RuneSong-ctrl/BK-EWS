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
        Schema::table('ews_notifications', function (Blueprint $table) {
            $table->timestamp('sending_at')->nullable()->after('sent_at');
            $table->index(['status', 'sending_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ews_notifications', function (Blueprint $table) {
            $table->dropIndex(['status', 'sending_at']);
            $table->dropColumn('sending_at');
        });
    }
};
