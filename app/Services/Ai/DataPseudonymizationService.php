<?php

namespace App\Services\Ai;

use App\Models\Student;

class DataPseudonymizationService
{
    /**
     * Sanitasi data siswa ke format anonim/pseudonim untuk kepatuhan UU PDP
     */
    public function sanitizeForPrompt(Student $student): array
    {
        $appKey = config('app.key') ?: 'default-secret-key-for-bk-ews';
        $pseudoId = 'SISWA-' . strtoupper(substr(hash('sha256', $student->id . $appKey), 0, 8));

        return [
            'pseudo_id' => $pseudoId,
            'gender' => $student->gender === 'L' ? 'Laki-laki' : 'Perempuan',
            'grade_level' => optional($student->currentClass())->name ?? 'Kelas X',
        ];
    }
}
