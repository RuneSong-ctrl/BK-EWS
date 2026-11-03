<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EwsBotSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_name',
        'phone_number',
        'status',
        'qr_code_payload',
        'last_heartbeat_at',
    ];

    protected function casts(): array
    {
        return [
            'last_heartbeat_at' => 'datetime',
        ];
    }

    /**
     * Apakah bot dalam status aktif terhubung secara real-time (detak < 60 detik)
     */
    public function isOnline(): bool
    {
        return $this->status === 'connected' &&
            $this->last_heartbeat_at !== null &&
            $this->last_heartbeat_at->diffInSeconds(now()) <= 60;
    }
}
