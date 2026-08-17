<?php

namespace App\Services\Ai;

use App\Models\AiAnalysisLog;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAdvisorService
{
    public function __construct(
        protected DataPseudonymizationService $pseudonymizationService
    ) {}

    public function generateAnalysis(Student $student): ?AiAnalysisLog
    {
        $ewsScore = $student->ewsScore;
        if (!$ewsScore) {
            return null;
        }

        $sanitized = $this->pseudonymizationService->sanitizeForPrompt($student);
        $context = $this->buildContextPayload($student, $sanitized);

        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');
        $model = config('services.gemini.model') ?? env('GEMINI_MODEL', 'gemini-2.5-flash');
        $analysisResult = null;

        if (!empty($apiKey)) {
            try {
                $analysisResult = $this->callLlmApi($context, $apiKey, $model);
            } catch (\Throwable $e) {
                Log::warning('AI Advisor API call failed, using heuristic advisor', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!$analysisResult) {
            $analysisResult = $this->generateLocalAnalysis($context);
        }

        return AiAnalysisLog::create([
            'student_id' => $student->id,
            'ews_score_id' => $ewsScore->id,
            'risk_overview' => $analysisResult['risk_overview'],
            'primary_concerns' => $analysisResult['primary_concerns'] ?? [],
            'recommendations' => $analysisResult['recommendations'] ?? [],
            'data_limitation_note' => $analysisResult['data_limitation_note'] ?? null,
            'model_version' => !empty($apiKey) ? $model : 'local-deterministic-v1',
            'generated_at' => Carbon::now(),
        ]);
    }

    private function buildContextPayload(Student $student, array $sanitized): array
    {
        $ewsScore = $student->ewsScore;
        $academicRecords = $student->academicRecords()->latest('created_at')->take(5)->get();
        $attendanceRecords = $student->attendanceRecords()->where('date', '>=', Carbon::today()->subDays(30))->get();
        $behaviors = $student->behaviorObservations()->where('date', '>=', Carbon::today()->subMonths(6))->get();
        $bkCases = $student->bkCases()->whereIn('status', ['BARU_DILAPORKAN', 'DALAM_PROSES', 'DIESKALASI_KE_KEPSEK'])->get();

        $academicAvg = $academicRecords->avg('score') ?? 0;
        $attendanceRate = $attendanceRecords->count() > 0
            ? ($attendanceRecords->whereIn('status', ['HADIR', 'TERLAMBAT'])->count() / $attendanceRecords->count()) * 100
            : 0;

        return [
            'student_pseudo_id' => $sanitized['pseudo_id'],
            'gender' => $sanitized['gender'],
            'grade_level' => $sanitized['grade_level'],
            'current_ews_status' => $ewsScore->status,
            'triggered_parameters' => $ewsScore->triggered_by_parameters ?? [],
            'academic_summary' => [
                'average' => round($academicAvg, 1),
                'sub_status' => $ewsScore->academic_sub_status,
                'records_count' => $academicRecords->count(),
            ],
            'attendance_summary' => [
                'rate_30_days' => round($attendanceRate, 1) . '%',
                'sub_status' => $ewsScore->attendance_sub_status,
                'alpa_count' => $attendanceRecords->where('status', 'ALPA')->count(),
            ],
            'behavior_summary' => [
                'sub_status' => $ewsScore->behavior_sub_status,
                'recent_incidents' => $behaviors->count(),
            ],
            'bk_cases_summary' => [
                'sub_status' => $ewsScore->bk_sub_status,
                'active_cases' => $bkCases->count(),
            ],
        ];
    }

    private function callLlmApi(array $context, string $apiKey, string $model = 'gemini-2.5-flash'): ?array
    {
        $endpoint = config('services.ai.endpoint') ?? config('services.gemini.endpoint') ?? env('AI_ENDPOINT') ?? env('GEMINI_ENDPOINT');

        $systemPrompt = <<<PROMPT
Anda adalah Konsultan Pakar Psikologi Pendidikan & Early Warning System (EWS) Sekolah Menengah.
Tugas: Menganalisis profil data agregat 4 pilar siswa (Akademik, Kehadiran, Perilaku, Kasus BK) dan merumuskan intervensi presisi terkoordinasi untuk 3 pemangku kepentingan.

Pedoman Analisis:
1. `risk_overview`: Rumuskan akar masalah secara holistik dalam 2-3 kalimat (korelasikan tren nilai, presensi, dan dinamika perilaku).
2. `primary_concerns`: Daftar 2-4 poin risiko paling mendesak yang butuh atensi cepat.
3. `recommendations`:
   - `for_homeroom_teacher`: Langkah taktis harian di kelas (pendekatan personal, adaptasi pembelajaran, pemantauan presensi).
   - `for_counselor_bk`: Strategi intervensi konseling terarah (konseling individual/kelompok, asesmen psikososial, koordinasi orang tua).
   - `for_principal`: Arahan manajerial pimpinan sekolah (dukungan kebijakan, monitoring SOP eskalasi, mitigasi risiko kelembagaan).
4. `data_limitation_note`: Catatan keterbatasan data bila salah satu pilar masih PENDING.

Format Output WAJIB JSON murni:
{
  "risk_overview": "Ringkasan analisis akar masalah 2-3 kalimat",
  "primary_concerns": ["Fokus risiko 1", "Fokus risiko 2"],
  "recommendations": {
    "for_homeroom_teacher": "Aksi taktis konkret wali kelas",
    "for_counselor_bk": "Aksi intervensi spesifik konselor BK",
    "for_principal": "Arahan manajerial Kepala Sekolah"
  },
  "data_limitation_note": "Catatan kelengkapan data atau null jika data lengkap"
}
PROMPT;

        $userContent = "Konteks Agregat Siswa:\n" . json_encode($context, JSON_PRETTY_PRINT);

        $isOpenAiFormat = $endpoint && (
            str_contains($endpoint, '/chat/completions') ||
            str_contains($endpoint, '/v1') ||
            str_contains($endpoint, 'openrouter') ||
            str_contains($endpoint, 'groq') ||
            str_contains($endpoint, 'deepseek') ||
            str_contains($endpoint, 'openai')
        );

        if ($isOpenAiFormat) {
            $url = str_ends_with($endpoint, '/chat/completions') ? $endpoint : rtrim($endpoint, '/') . '/chat/completions';
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->timeout(25)
                ->post($url, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userContent],
                    ],
                    'temperature' => 0.2,
                ]);

            if ($response->successful()) {
                $body = trim($response->body());

                // 1. Standard JSON response
                $json = json_decode($body, true);
                $content = $json['choices'][0]['message']['content'] ?? null;

                // 2. SSE Stream chunks response (data: { ... })
                if (!$content && str_contains($body, 'data:')) {
                    $lines = explode("\n", $body);
                    $streamText = '';
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if (str_starts_with($line, 'data:')) {
                            $payload = trim(substr($line, 5));
                            if ($payload === '[DONE]') continue;
                            $chunk = json_decode($payload, true);
                            if (isset($chunk['choices'][0]['delta']['content'])) {
                                $streamText .= $chunk['choices'][0]['delta']['content'];
                            }
                        }
                    }
                    if (!empty($streamText)) {
                        $content = $streamText;
                    }
                }

                if ($content) {
                    $cleanJson = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
                    $cleanJson = preg_replace('/\s*```$/', '', $cleanJson);
                    $decoded = json_decode($cleanJson, true);
                    if (is_array($decoded)) {
                        return $decoded;
                    }
                }
            }
        } else {
            $baseUrl = $endpoint ? rtrim($endpoint, '/') : 'https://generativelanguage.googleapis.com/v1beta';
            $url = "{$baseUrl}/models/{$model}:generateContent?key={$apiKey}";

            $response = Http::withoutVerifying()
                ->timeout(15)
                ->post($url, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $systemPrompt . "\n\n" . $userContent],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.2,
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
        }

        return null;
    }

    private function generateLocalAnalysis(array $context): array
    {
        $status = $context['current_ews_status'];
        $triggers = $context['triggered_parameters'];

        $concerns = [];
        foreach ($triggers as $trig) {
            $concerns[] = 'Indikator terpicu: ' . str_replace('_', ' ', $trig);
        }

        if (empty($concerns)) {
            $concerns[] = 'Performa siswa dalam rentang pemantauan umum.';
        }

        $overview = match ($status) {
            'KRITIS' => "Siswa menunjukkan indikator risiko tinggi yang memerlukan intervensi segera dari tim BK dan pemantauan manajerial Kepala Sekolah.",
            'WASPADA' => "Siswa mengalami penurunan performa multi-parameter yang membutuhkan komunikasi proaktif dan pendampingan terstruktur.",
            'BERISIKO' => "Siswa teridentifikasi mengalami hambatan awal (nilai di bawah KKM atau absensi sporadis) yang perlu dicegah sebelum memburuk.",
            'NORMAL' => "Perkembangan siswa secara umum stabil dan memenuhi standar akademik serta kehadiran.",
            default => "Data siswa belum memenuhi ambang batas minimum untuk evaluasi komprehensif.",
        };

        return [
            'risk_overview' => $overview,
            'primary_concerns' => $concerns,
            'recommendations' => [
                'for_homeroom_teacher' => 'Lakukan pengecekan jurnal kehadiran harian dan koordinasikan dengan guru mata pelajaran terkait.',
                'for_counselor_bk' => 'Jadwalkan sesi konseling individual untuk mendalami faktor personal, keluarga, atau lingkungan belajar.',
                'for_principal' => 'Pastikan prosedur eskalasi kasus berat dijalankan sesuai SOP dan pantau tren agregat mingguan.',
            ],
            'data_limitation_note' => $status === 'DATA_BELUM_LENGKAP' ? 'Membutuhkan minimal 2 nilai akademik dan 5 hari absensi.' : null,
        ];
    }
}
