<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EwsCounselingJournal extends Model
{
    use HasFactory;

    protected $fillable = [
        'summary_id',
        'guru_bk_id',
        'jenis_layanan',
        'catatan_konseling',
        'rencana_tindak_lanjut',
        'evaluasi_perilaku',
        'tanggal_monitoring_berikutnya',
    ];

    protected $casts = [
        'tanggal_monitoring_berikutnya' => 'date',
    ];

    public function summary(): BelongsTo
    {
        return $this->belongsTo(EwsStudentSummary::class, 'summary_id');
    }

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guru_bk_id');
    }
}
