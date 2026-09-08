<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoodleSyncLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'triggered_by',
        'sync_type',
        'status',
        'students_processed',
        'message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'students_processed' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }
}
