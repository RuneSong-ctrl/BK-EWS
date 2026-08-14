<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAnalysisLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'student_id',
        'ews_score_id',
        'risk_overview',
        'primary_concerns',
        'recommendations',
        'data_limitation_note',
        'model_version',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'primary_concerns' => 'array',
            'recommendations' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function ewsScore(): BelongsTo
    {
        return $this->belongsTo(EwsScore::class);
    }
}
