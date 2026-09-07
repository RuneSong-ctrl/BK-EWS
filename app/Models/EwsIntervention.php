<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EwsIntervention extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_id',
        'counselor_id',
        'bk_case_id',
        'intervention_type',
        'action_notes',
        'student_progress',
        'follow_up_date',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_date' => 'date',
        ];
    }

    /**
     * Notifikasi EWS rujukan intervensi ini
     */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(EwsNotification::class, 'notification_id');
    }

    /**
     * Guru BK / Konselor penanggung jawab intervensi
     */
    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    /**
     * Kasus BK formal terkait (jika dieskalasikan)
     */
    public function bkCase(): BelongsTo
    {
        return $this->belongsTo(BkCase::class, 'bk_case_id');
    }
}
