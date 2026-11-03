<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EwsNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'target_user_id',
        'alert_id',
        'summary_id',
        'recipient_type',
        'recipient_name',
        'recipient_phone',
        'risk_level',
        'message_type',
        'message_text',
        'status',
        'retry_count',
        'error_message',
        'scheduled_at',
        'sent_at',
        'sending_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'sending_at' => 'datetime',
            'retry_count' => 'integer',
        ];
    }

    /**
     * Scope notifikasi yang macet di proses sending (> threshold menit)
     */
    public function scopeAbandoned(Builder $query, int $minutes = 5): Builder
    {
        return $query->where('status', 'sending')
            ->where('sending_at', '<=', now()->subMinutes($minutes));
    }

    /**
     * User penerima (Guru Mapel / Guru BK) jika terdaftar di tabel users
     */
    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    /**
     * Alert Tier 1 (Guru Mapel) terkait
     */
    public function alert(): BelongsTo
    {
        return $this->belongsTo(EwsCourseAlert::class, 'alert_id');
    }

    /**
     * Summary Tier 2 (Guru BK) terkait
     */
    public function summary(): BelongsTo
    {
        return $this->belongsTo(EwsStudentSummary::class, 'summary_id');
    }

    /**
     * Scope notifikasi siap dikirim
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending')->orderBy('scheduled_at', 'asc');
    }

    /**
     * Scope notifikasi terkirim
     */
    public function scopeSent(Builder $query): Builder
    {
        return $query->where('status', 'sent')->orderBy('sent_at', 'desc');
    }

    /**
     * Scope notifikasi gagal
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed')->orderBy('updated_at', 'desc');
    }
}
