<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EwsScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'status',
        'academic_sub_status',
        'attendance_sub_status',
        'behavior_sub_status',
        'bk_sub_status',
        'triggered_by_parameters',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'triggered_by_parameters' => 'array',
            'calculated_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function aiLogs(): HasMany
    {
        return $this->hasMany(AiAnalysisLog::class);
    }
}
