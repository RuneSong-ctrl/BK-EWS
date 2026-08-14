<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EwsScoreHistory extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'ews_score_history';

    protected $fillable = [
        'student_id',
        'old_status',
        'new_status',
        'trigger_reasons',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'trigger_reasons' => 'array',
            'recorded_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
