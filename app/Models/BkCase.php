<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BkCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'incident_date',
        'reported_date',
        'case_types',
        'bullying_role',
        'severity',
        'status',
        'follow_up_actions',
        'involved_students_count',
        'confidential_notes',
        'handled_by',
    ];

    protected function casts(): array
    {
        return [
            'case_types' => 'array',
            'follow_up_actions' => 'array',
            'confidential_notes' => 'encrypted',
            'incident_date' => 'date',
            'reported_date' => 'date',
            'involved_students_count' => 'integer',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    /**
     * Scope untuk menegakkan hak akses berbasis role (UU PDP Governance)
     */
    public function scopeAccessibleBy(Builder $query, User $user): Builder
    {
        if ($user->isGuruBk()) {
            return $query;
        }

        if ($user->isKepsek()) {
            return $query->where(function (Builder $q) {
                $q->where('severity', 'BERAT')
                  ->orWhere('status', 'DIESKALASI_KE_KEPSEK')
                  ->orWhereHas('student.ewsScore', function (Builder $sq) {
                      $sq->whereIn('status', ['WASPADA', 'KRITIS']);
                  });
            });
        }

        // Guru kelas dilarang melihat data kasus BK langsung
        return $query->whereRaw('1 = 0');
    }
}
