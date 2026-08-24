<?php

namespace App\Services\Ai;

use App\Models\Student;

/**
 * Service: DataPseudonymizationService
 * 
 * Modul Pseudonimisasi & Kepatuhan Perlindungan Data Pribadi (UU PDP No. 27/2022).
 * Berfungsi mengonversi identitas langsung siswa (Nama Asli, NIS, NISN) menjadi
 * Identifier Pseudonim acak berbasis HMAC SHA-256 sebelum data dikirim ke LLM eksternal.
 */
class DataPseudonymizationService
{
    /**
     * Sanitasi data siswa ke format anonim/pseudonim untuk kepatuhan UU PDP
     *
     * @param Student $student Model Siswa
     * @return array{pseudo_id: string, gender: string, grade_level: string}
     */
    public function sanitizeForPrompt(Student $student): array
    {
        $appKey = config('app.key') ?: hash('sha256', (string) config('app.name', 'EJurnalSTIKMAS'));
        $pseudoId = 'SISWA-' . strtoupper(substr(hash('sha256', $student->id . $appKey), 0, 8));


        return [
            'pseudo_id' => $pseudoId,
            'gender' => $student->gender === 'L' ? 'Laki-laki' : 'Perempuan',
            'grade_level' => optional($student->currentClass())->name ?? 'Kelas X',
        ];
    }
}

