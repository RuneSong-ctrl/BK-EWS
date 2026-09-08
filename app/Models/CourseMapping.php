<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseMapping extends Model
{
    use HasFactory;

    protected $fillable = [
        'code_module',
        'nama_mapel',
        'kategori_mapel',
        'nama_guru_mapel',
        'no_wa_guru',
        'kkm',
    ];

    protected $casts = [
        'kkm' => 'integer',
    ];
}
