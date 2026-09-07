<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EwsNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'moodle_student_id',
        'student_name',
        'class_name',
        'course_code',
        'academic_period',
        'risk_level',
        'risk_probability',
        'risk_percentage',
        'decision_threshold',
        'intervention_urgency',
        'moodle_metrics',
        'risk_factors',
        'ai_narration',
        'wa_message',
        'audience',
        'target_user_id',
        'target_phone',
        'status',
        'error_message',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'risk_probability' => 'float',
            'decision_threshold' => 'float',
            'moodle_metrics' => 'array',
            'risk_factors' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    /**
     * Siswa terkait (jika sudah terpetakan di sistem lokal)
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Guru / Konselor penerima notifikasi
     */
    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    /**
     * Riwayat intervensi / tindak lanjut atas notifikasi ini
     */
    public function interventions(): HasMany
    {
        return $this->hasMany(EwsIntervention::class, 'notification_id');
    }
}
