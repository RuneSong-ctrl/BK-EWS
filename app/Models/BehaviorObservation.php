<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BehaviorObservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'date',
        'category',
        'severity',
        'raw_text',
        'ai_structured_summary',
        'confirmed_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'raw_text' => 'encrypted',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function confirmedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
