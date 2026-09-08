<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EwsStudentSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'siswa_id',
        'total_mapel_diambil',
        'total_mapel_berisiko',
        'total_jam_belajar',
        'total_tugas_belum_dikumpul',
        'total_tugas_terlambat',
        'inaktivitas_terlama_hari',
        'profil_karakter_belajar',
        'prioritas_konseling',
        'rekomendasi_tindakan',
        'rincian_per_mata_pelajaran',
        'status_penanganan',
    ];

    protected $casts = [
        'total_mapel_diambil' => 'integer',
        'total_mapel_berisiko' => 'integer',
        'total_jam_belajar' => 'float',
        'total_tugas_belum_dikumpul' => 'integer',
        'total_tugas_terlambat' => 'integer',
        'inaktivitas_terlama_hari' => 'integer',
        'rincian_per_mata_pelajaran' => 'array',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'siswa_id');
    }

    public function counselingJournals(): HasMany
    {
        return $this->hasMany(EwsCounselingJournal::class, 'summary_id');
    }
}
