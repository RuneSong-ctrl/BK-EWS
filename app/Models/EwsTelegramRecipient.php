<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EwsTelegramRecipient extends Model
{
    protected $fillable = [
        'recipient_name',
        'link_token',
        'chat_id',
        'telegram_username',
        'linked_at',
    ];

    protected function casts(): array
    {
        return [
            'linked_at' => 'datetime',
        ];
    }

    public static function forName(string $name): self
    {
        return static::firstOrCreate(['recipient_name' => $name], ['link_token' => Str::random(32)]);
    }
}
