<?php

namespace App\Console\Commands;

use App\Models\CourseMapping;
use App\Models\EwsTelegramRecipient;
use App\Models\User;
use Illuminate\Console\Command;

class TelegramLinks extends Command
{
    protected $signature = 'ews:telegram-links {--name=* : Tambah penerima manual (mis. "Admin Uji Coba")}';

    protected $description = 'Mencetak link Start Telegram untuk setiap Guru Mapel & Guru BK penerima notifikasi EWS';

    public function handle(): int
    {
        $bot = config('services.ews.telegram_bot_username');
        if (!$bot) {
            $this->error('TELEGRAM_BOT_USERNAME belum diisi di .env');
            return Command::FAILURE;
        }

        $names = CourseMapping::pluck('nama_guru_mapel')
            ->merge(User::where('role', 'guru_bk')->pluck('name'))
            ->merge($this->option('name'))
            ->filter()->unique()->values();

        $rows = $names->map(function (string $name) use ($bot) {
            $recipient = EwsTelegramRecipient::forName($name);
            return [
                $name,
                $recipient->chat_id ? 'TERTAUT' : 'belum',
                "https://t.me/{$bot}?start={$recipient->link_token}",
            ];
        });

        $this->table(['Penerima', 'Status', 'Link Start (kirim ke guru ybs)'], $rows);

        return Command::SUCCESS;
    }
}
