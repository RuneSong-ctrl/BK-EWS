<?php

namespace App\Console\Commands;

use App\Models\EwsNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RecoverAbandonedNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ews:recover-abandoned {--minutes=5 : Ambang batas menit status sending dianggap macet/abandoned}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Memulihkan notifikasi EWS yang macet di status sending kembali ke pending';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');
        if ($minutes < 1) {
            $minutes = 5;
        }

        $abandoned = EwsNotification::abandoned($minutes)->get();
        $count = $abandoned->count();

        if ($count === 0) {
            $this->info("Tidak ada notifikasi macet (threshold: {$minutes} menit).");
            return Command::SUCCESS;
        }

        $recovered = 0;
        foreach ($abandoned as $notif) {
            $notif->update([
                'status' => 'pending',
                'sending_at' => null,
                'retry_count' => $notif->retry_count + 1,
                'error_message' => "Auto-recovered: Macet di status 'sending' lebih dari {$minutes} menit.",
            ]);
            $recovered++;

            Log::warning("EWS Notification #{$notif->id} recovered dari status 'sending' macet.", [
                'recipient' => $notif->recipient_name,
                'phone' => $notif->recipient_phone,
                'retry_count' => $notif->retry_count,
            ]);
        }

        $this->info("Berhasil memulihkan {$recovered} notifikasi macet kembali ke status 'pending'.");

        return Command::SUCCESS;
    }
}
