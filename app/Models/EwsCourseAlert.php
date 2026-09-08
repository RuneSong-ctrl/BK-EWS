<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EwsCourseAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'siswa_id',
        'kode_modul',
        'nama_mapel',
        'kategori_mapel',
        'guru_pengampu',
        'kkm',
        'tingkat_risiko',
        'probabilitas_risiko',
        'durasi_belajar_jam',
        'lesson_attempts',
        'rasio_ketuntasan_lesson',
        'nilai_rata_rata_lesson',
        'tugas_belum_dikumpul',
        'tugas_terlambat',
        'nilai_rata_rata_tugas',
        'metrik_24_fitur_model',
        'faktor_pemicu',
        'rekomendasi_tindakan',
        'status',
        'catatan_guru_mapel',
    ];

    protected $casts = [
        'kkm' => 'integer',
        'probabilitas_risiko' => 'float',
        'durasi_belajar_jam' => 'float',
        'lesson_attempts' => 'integer',
        'rasio_ketuntasan_lesson' => 'float',
        'nilai_rata_rata_lesson' => 'float',
        'tugas_belum_dikumpul' => 'integer',
        'tugas_terlambat' => 'integer',
        'nilai_rata_rata_tugas' => 'float',
        'metrik_24_fitur_model' => 'array',
        'faktor_pemicu' => 'array',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'siswa_id');
    }
}
