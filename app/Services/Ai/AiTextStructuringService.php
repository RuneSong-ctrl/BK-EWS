<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiTextStructuringService
{
    public const ALLOWED_CATEGORIES = [
        'MENARIK_DIRI',
        'AGRESIF_FISIK',
        'AGRESIF_VERBAL',
        'TIDAK_FOKUS',
        'PELANGGARAN_ATURAN',
        'PERILAKU_POSITIF',
    ];

    public const ALLOWED_SEVERITIES = [
        'RINGAN',
        'SEDANG',
        'BERAT',
    ];

    /**
     * Parse and structure teacher raw observation text
     */
    public function structureObservation(string $rawText): array
    {
        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');
        $model = config('services.gemini.model') ?? env('GEMINI_MODEL', 'gemini-2.5-flash');

        if (!empty($apiKey)) {
            try {
                $response = $this->callLlmApi($rawText, $apiKey, $model);
                if ($response && isset($response['category'], $response['severity'])) {
                    return $response;
                }
            } catch (\Throwable $e) {
                Log::warning('AI Text Structuring API failed, falling back to local heuristic', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $this->localFallbackStructuring($rawText);
    }

    private function callLlmApi(string $rawText, string $apiKey, string $model = 'gemini-2.5-flash'): ?array
    {
        $systemPrompt = <<<PROMPT
Anda adalah asisten AI klasifikasi psikososial dan perilaku siswa sekolah menengah.
Tugas Anda: Menerima teks observasi guru bahasa Indonesia tidak terstruktur, lalu mengekstraknya ke JSON terstruktur dengan skema ketat.

Kategori yang diizinkan:
- MENARIK_DIRI
- AGRESIF_FISIK
- AGRESIF_VERBAL
- TIDAK_FOKUS
- PELANGGARAN_ATURAN
- PERILAKU_POSITIF

Severity yang diizinkan:
- RINGAN (pelanggaran minor, tidak merugikan orang lain)
- SEDANG (perselisihan, pelanggaran tata tertib berulang)
- BERAT (kekerasan fisik, senjata, obat terlarang, bullying parah)

Output WAJIB berupa JSON murni:
{
  "category": "...",
  "severity": "...",
  "ai_structured_summary": "Ringkasan formal maks 20 kata",
  "suggested_action": "Saran tindak lanjut singkat"
}
PROMPT;

        $response = Http::timeout(10)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemPrompt . "\n\nTeks Observasi:\n" . $rawText],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.1,
                ],
            ]);

        if ($response->successful()) {
            $jsonText = $response->json('candidates.0.content.parts.0.text');
            if ($jsonText) {
                $cleanJson = preg_replace('/^```(?:json)?\s*/i', '', trim($jsonText));
                $cleanJson = preg_replace('/\s*```$/', '', $cleanJson);
                return json_decode($cleanJson, true);
            }
        }

        return null;
    }

    /**
     * Local Heuristic Fallback for Offline / Dev / Test environment
     */
    public function localFallbackStructuring(string $rawText): array
    {
        $lower = strtolower($rawText);

        // Agresif Fisik & Berat
        if (preg_match('/(pukul|berkelahi|hantam|tendang|tampar|senjata|rokok|vape|narkoba|miras|aniaya)/', $lower)) {
            $isSevere = preg_match('/(senjata|narkoba|miras|berdarah|parah|keroyok)/', $lower);
            return [
                'category' => 'AGRESIF_FISIK',
                'severity' => $isSevere ? 'BERAT' : 'SEDANG',
                'ai_structured_summary' => 'Terlibat insiden fisik atau pelanggaran keamanan di lingkungan sekolah.',
                'suggested_action' => 'Pemisahan langsung dan pemanggilan Guru BK untuk mediasi disiplin.',
            ];
        }

        // Agresif Verbal / Bullying
        if (preg_match('/(ejek|hina|maki|bentak|kata kotor|umpat|bully|ancam)/', $lower)) {
            return [
                'category' => 'AGRESIF_VERBAL',
                'severity' => str_contains($lower, 'ancam') || str_contains($lower, 'bully') ? 'SEDANG' : 'RINGAN',
                'ai_structured_summary' => 'Menunjukkan agresi verbal atau ketidaksopanan komunikasi kepada rekan/guru.',
                'suggested_action' => 'Teguran lisan terstruktur dan bimbingan etika bertutur.',
            ];
        }

        // Menarik Diri / Isu Emosional
        if (preg_match('/(murung|diam|sendiri|menangis|isolasi|menutup diri|lemas|lesu|tidak mau bicara)/', $lower)) {
            return [
                'category' => 'MENARIK_DIRI',
                'severity' => str_contains($lower, 'menangis') || str_contains($lower, 'menutup diri') ? 'SEDANG' : 'RINGAN',
                'ai_structured_summary' => 'Siswa tampak murung atau mengisolasi diri dari interaksi kelompok kelas.',
                'suggested_action' => 'Pendekatan personal empati oleh wali kelas dan observasi lanjutan.',
            ];
        }

        // Tidak Fokus / Mengantuk
        if (preg_match('/(tidur|mengantuk|melamun|gadget|hp|main game|tidak fokus|tidak memperhatikan)/', $lower)) {
            return [
                'category' => 'TIDAK_FOKUS',
                'severity' => 'RINGAN',
                'ai_structured_summary' => 'Kurang fokus pada materi pembelajaran atau terdistraksi aktivitas lain.',
                'suggested_action' => 'Pemberian interaksi aktif di kelas dan pengecekan pola istirahat malam.',
            ];
        }

        // Perilaku Positif
        if (preg_match('/(rajin|membantu|prestasi|aktif|inisiatif|sopan|memimpin|kerjasama)/', $lower)) {
            return [
                'category' => 'PERILAKU_POSITIF',
                'severity' => 'RINGAN',
                'ai_structured_summary' => 'Menunjukkan inisiatif atau kontribusi positif yang patut diapresiasi.',
                'suggested_action' => 'Berikan penguatan positif (positive reinforcement) di hadapan kelas.',
            ];
        }

        // Default: Pelanggaran Aturan Umum
        return [
            'category' => 'PELANGGARAN_ATURAN',
            'severity' => 'RINGAN',
            'ai_structured_summary' => 'Pelanggaran tata tertib umum atau deviasi kebiasaan belajar di kelas.',
            'suggested_action' => 'Teguran dan pencatatan dalam buku jurnal harian wali kelas.',
        ];
    }
}
