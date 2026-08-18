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
   - `for_homeroom_teacher`: Objek berformat { "action": "Aksi konkret taktis di kelas", "focus": "Fokus tindakan (misal: Observasi Kelas / Verifikasi Data / Remedial)", "badge": "Frekuensi/Urgensi (misal: Harian / Mendesak / Mingguan)", "checklist": "Target aksi konkret utama" }
   - `for_counselor_bk`: Objek berformat { "action": "Strategi intervensi konseling terarah", "focus": "Fokus bimbingan (misal: Konseling Individu / Asesmen / Mediasi)", "badge": "Metode (misal: Konseling / Bimbingan / Segera)", "checklist": "Target aksi konkret utama" }
   - `for_principal`: Objek berformat { "action": "Arahan manajerial pimpinan sekolah", "focus": "Fokus kebijakan (misal: Supervisi Data / Disposisi Kasus / Monitoring)", "badge": "Tingkat (misal: Manajerial / Disposisi / Evaluasi)", "checklist": "Target aksi konkret utama" }
4. `data_limitation_note`: Catatan keterbatasan data bila salah satu pilar masih PENDING.

Format Output WAJIB JSON murni:
{
  "risk_overview": "Ringkasan analisis akar masalah 2-3 kalimat",
  "primary_concerns": ["Fokus risiko 1", "Fokus risiko 2"],
  "recommendations": {
    "for_homeroom_teacher": {
      "action": "Langkah taktis guru kelas...",
      "focus": "Fokus aksi",
      "badge": "Harian",
      "checklist": "Target aksi"
    },
    "for_counselor_bk": {
      "action": "Langkah konseling BK...",
      "focus": "Fokus bimbingan",
      "badge": "Konseling",
      "checklist": "Target aksi"
    },
    "for_principal": {
      "action": "Arahan kepala sekolah...",
      "focus": "Fokus manajerial",
      "badge": "Manajemen",
      "checklist": "Target aksi"
    }
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
            default => "Data siswa belum memenuhi ambang batas minimum untuk evaluasi komprehensif 4 pilar.",
        };

        $recommendations = match ($status) {
            'KRITIS' => [
                'for_homeroom_teacher' => [
                    'action' => 'Lakukan pengawasan intensif di kelas, amankan dinamika interaksi teman sebaya, dan berikan laporan berkala harian ke Guru BK.',
                    'focus' => 'Intervensi Kelas & Pengawasan',
                    'badge' => 'Prioritas 1',
                    'checklist' => 'Pendampingan intensif & lapor harian ke BK',
                ],
                'for_counselor_bk' => [
                    'action' => 'Jadwalkan konferensi kasus (case conference) darurat, panggil orang tua/wali, dan susun kontrak perilaku serta asesmen mendalam.',
                    'focus' => 'Konseling Krisis & Konferensi Kasus',
                    'badge' => 'Segera',
                    'checklist' => 'Panggilan orang tua & case conference',
                ],
                'for_principal' => [
                    'action' => 'Terbitkan lembar disposisi penanganan khusus, tinjau mitigasi risiko kelembagaan, dan pimpin koordinasi terpadu berkala.',
                    'focus' => 'Disposisi & Eskalasi Kebijakan',
                    'badge' => 'Disposisi',
                    'checklist' => 'Penerbitan disposisi khusus & monitoring mitigasi',
                ],
            ],
            'WASPADA' => [
                'for_homeroom_teacher' => [
                    'action' => 'Tingkatkan dialog empatik berkala, pantau kehadiran dan penyelesaian tugas harian, serta identifikasi kendala belajar awal.',
                    'focus' => 'Pendampingan & Presensi',
                    'badge' => 'Harian',
                    'checklist' => 'Dialog personal & monitoring presensi ketat',
                ],
                'for_counselor_bk' => [
                    'action' => 'Lakukan asesmen psikososial awal dan jadwalkan 2 sesi konseling individual untuk mendalami akar masalah siswa.',
                    'focus' => 'Bimbingan Preventif & Asesmen',
                    'badge' => 'Konseling',
                    'checklist' => 'Sesi konseling individual & pemetaan hambatan',
                ],
                'for_principal' => [
                    'action' => 'Supervisi koordinasi tindak lanjut antara wali kelas dan guru BK, serta evaluasi dinamika risiko mingguan.',
                    'focus' => 'Evaluasi Tindak Lanjut & Supervisi',
                    'badge' => 'Evaluasi',
                    'checklist' => 'Review berkala koordinasi wali kelas & BK',
                ],
            ],
            'BERISIKO' => [
                'for_homeroom_teacher' => [
                    'action' => 'Berikan pendampingan akademik tambahan, fasilitasi tutor sebaya, dan berikan penguatan motivasi di ruang kelas.',
                    'focus' => 'Remedial & Motivasi',
                    'badge' => 'Mingguan',
                    'checklist' => 'Bimbingan tugas & penguatan motivasi kelas',
                ],
                'for_counselor_bk' => [
                    'action' => 'Fasilitasi bimbingan kelompok atau konseling suportif singkat guna mendeteksi faktor penghambat belajar siswa.',
                    'focus' => 'Bimbingan Kelompok & Observasi',
                    'badge' => 'Bimbingan',
                    'checklist' => 'Identifikasi faktor penurunan & konseling berkala',
                ],
                'for_principal' => [
                    'action' => 'Pantau tren indikator risiko siswa secara proaktif melalui dashboard analitik EWS.',
                    'focus' => 'Monitoring Proaktif',
                    'badge' => 'Monitoring',
                    'checklist' => 'Pantau tren grafik EWS mingguan',
                ],
            ],
            'NORMAL' => [
                'for_homeroom_teacher' => [
                    'action' => 'Berikan apresiasi atas konsistensi belajar siswa dan pelihara iklim kelas yang inklusif serta suportif.',
                    'focus' => 'Observasi & Apresiasi Positif',
                    'badge' => 'Rutin',
                    'checklist' => 'Pemeliharaan partisipasi aktif di kelas',
                ],
                'for_counselor_bk' => [
                    'action' => 'Dukung eksplorasi minat, bakat, dan pembinaan karir/potensi masa depan secara berkelanjutan.',
                    'focus' => 'Bimbingan Karir & Minat',
                    'badge' => 'Pengembangan',
                    'checklist' => 'Eksplorasi potensi & bimbingan perkembangan',
                ],
                'for_principal' => [
                    'action' => 'Dukung program pengayaan dan pemeliharaan iklim sekolah yang aman, sehat, dan kondusif.',
                    'focus' => 'Pengawasan Iklim & Apresiasi',
                    'badge' => 'Manajemen',
                    'checklist' => 'Pemeliharaan ekosistem belajar kondusif',
                ],
            ],
            default => [
                'for_homeroom_teacher' => [
                    'action' => 'Segera verifikasi dan pastikan pengumpulan serta input data nilai akademik dari guru mapel dan data presensi siswa.',
                    'focus' => 'Verifikasi & Input Data',
                    'badge' => 'Mendesak',
                    'checklist' => 'Lengkapi data nilai & presensi di EWS',
                ],
                'for_counselor_bk' => [
                    'action' => 'Berkoordinasi aktif dengan wali kelas untuk mempercepat pengumpulan data serta siapkan asesmen diagnostik awal.',
                    'focus' => 'Asesmen Awal & Koordinasi',
                    'badge' => 'Koordinasi',
                    'checklist' => 'Koordinasi wali kelas untuk pemetaan awal',
                ],
                'for_principal' => [
                    'action' => 'Terbitkan arahan pemenuhan data 4 pilar EWS kepada wali kelas dan pantau penyelesaian status PENDING.',
                    'focus' => 'Supervisi Kepatuhan Data EWS',
                    'badge' => 'Manajerial',
                    'checklist' => 'Instruksi percepatan kelengkapan 4 pilar',
                ],
            ],
        };

        return [
            'risk_overview' => $overview,
            'primary_concerns' => $concerns,
            'recommendations' => $recommendations,
            'data_limitation_note' => $status === 'DATA_BELUM_LENGKAP' ? 'Membutuhkan minimal 2 nilai akademik dan 5 hari absensi untuk kalkulasi 4 pilar penuh.' : null,
        ];
    }
}
