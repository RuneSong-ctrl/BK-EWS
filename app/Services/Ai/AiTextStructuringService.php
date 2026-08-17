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
     * Parse, auto-complete, and structure teacher raw observation text or quick selections
     */
     public function structureObservation(string $rawText = '', array $options = []): array
     {
         $apiKey = config('services.ai.api_key') ?? config('services.gemini.api_key') ?? env('AI_API_KEY') ?? env('GEMINI_API_KEY');
         $endpoint = config('services.ai.endpoint') ?? config('services.gemini.endpoint') ?? env('AI_ENDPOINT') ?? env('GEMINI_ENDPOINT');
         $model = config('services.ai.model') ?? config('services.gemini.model') ?? env('AI_MODEL') ?? env('GEMINI_MODEL', 'gemini-2.5-flash');

         $inputText = !empty($rawText) ? $rawText : ($options['keywords'] ?? $options['preset_topic'] ?? $options['category'] ?? 'Observasi umum');

         if (!empty($apiKey)) {
             try {
                 $response = $this->callLlmApi($inputText, $apiKey, $model, $endpoint, $options);
                 if ($response && isset($response['category'], $response['severity'])) {
                     return $response;
                 }
             } catch (\Throwable $e) {
                 Log::warning('AI Text Structuring API failed, falling back to local heuristic generator', [
                     'error' => $e->getMessage(),
                 ]);
             }
         }

         return $this->localFallbackStructuring($inputText, $options);
     }

     private function callLlmApi(string $rawText, string $apiKey, string $model = 'gemini-2.5-flash', ?string $endpoint = null, array $options = []): ?array
     {
         $studentName = $options['student_name'] ?? 'Siswa';
         $categoryHint = $options['category'] ?? '';
         $severityHint = $options['severity'] ?? '';

         $systemPrompt = <<<PROMPT
Anda adalah AI Spesialis Konsultasi Pedagogis & Penulisan Jurnal Observasi Siswa Sekolah Menengah (Standar Kemendikbud & Asosiasi Bimbingan Konseling).
Tugas Utama: Mengolah input guru (gejala perilaku, topik pilihan, atau kata kunci) menjadi catatan jurnal observasi profesional, terstruktur, objektif, dan bernilai psikososial.

Pedoman Penulisan Catatan Naratif (`generated_narrative`):
1. Formula 3 Bagian Wajib (2-3 kalimat runtut dan padat):
   - Bagian 1 (Fakta Teramati): Sebutkan nama siswa dan deskripsikan perilaku faktual secara objektif tanpa label negatif (misal: "teramati menunjukkan kecenderungan mengantuk dan kurang merespons instruksi...").
   - Bagian 2 (Dampak Dinamika): Uraikan potensi dampak terhadap pemahaman materi, keterlibatan belajar, atau interaksi sosial di kelas.
   - Bagian 3 (Tindakan/Respon Pendidik): Cantumkan langkah pendampingan awal wali kelas (misal: pendekatan empat mata, konfirmasi kondisi fisik/istirahat, atau pemantauan berkala).
2. Nada Bahasa: Formal, empatik, pedagogis, tidak menuduh/menghakimi, dan siap masuk arsip resmi sekolah.

Kategori yang diizinkan:
- TIDAK_FOKUS (disrupsi belajar, mengantuk, melamun, bermain HP)
- MENARIK_DIRI (isolasi, murung, menutup diri, cemas)
- PELANGGARAN_ATURAN (terlambat, tidak membawa tugas, melanggar tata tertib)
- AGRESIF_VERBAL (mengejek, membentak, berkata kasar, konflik)
- AGRESIF_FISIK (perkelahian, kontak fisik kasar, perundungan)
- PERILAKU_POSITIF (aktif berdiskusi, membantu teman, inisiatif terpuji)

Severity yang diizinkan:
- RINGAN (deviasi minor, bimbingan berkala wali kelas)
- SEDANG (pelanggaran berulang, butuh perhatian khusus)
- BERAT (insiden serius/kritis, perlu eskalasi tim BK/Kepsek)

Format Output WAJIB berupa JSON murni:
{
  "category": "KATEGORI_TERPILIH",
  "severity": "RINGAN / SEDANG / BERAT",
  "generated_narrative": "Paragraf naratif formal 2-3 kalimat lengkap sesuai formula 3 bagian di atas.",
  "ai_structured_summary": "Ringkasan identifikasi padat 8-15 kata."
}
PROMPT;

         $userContent = "Nama Siswa: {$studentName}\n" .
             ($categoryHint ? "Kategori Dipilih Guru: {$categoryHint}\n" : "") .
             ($severityHint ? "Tingkat Dipilih Guru: {$severityHint}\n" : "") .
             "Input / Gejala Perilaku:\n{$rawText}";

         // Check if custom endpoint is OpenAI-compatible (e.g. OpenRouter, Groq, local proxy, v1/chat/completions)
         $isOpenAiFormat = $endpoint && (
             str_contains($endpoint, '/chat/completions') ||
             str_contains($endpoint, '/v1') ||
             str_contains($endpoint, 'openrouter') ||
             str_contains($endpoint, 'groq') ||
             str_contains($endpoint, 'deepseek') ||
             str_contains($endpoint, 'openai') ||
             str_contains($endpoint, 'abc-tunnel')
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
                     // Clean thinking tags if present
                     $content = preg_replace('/<think>[\s\S]*?<\/think>/i', '', $content);
                     $cleanJson = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
                     $cleanJson = preg_replace('/\s*```$/', '', $cleanJson);
                     
                     if (preg_match('/\{[\s\S]*\}/', $cleanJson, $matches)) {
                         $decoded = json_decode($matches[0], true);
                         if (is_array($decoded) && isset($decoded['generated_narrative'])) {
                             return $decoded;
                         }
                     }
                 }
             }
         } else {
             // Default: Google Gemini REST API format
             $baseUrl = $endpoint ? rtrim($endpoint, '/') : 'https://generativelanguage.googleapis.com/v1beta';
             $url = "{$baseUrl}/models/{$model}:generateContent?key={$apiKey}";

             $response = Http::withoutVerifying()
                 ->timeout(12)
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

     /**
      * Local Smart Fallback Template Generator for Offline / Dev / Keyless environment
      */
     public function localFallbackStructuring(string $rawText, array $options = []): array
     {
         $lower = strtolower($rawText);
         $studentName = $options['student_name'] ?? 'Siswa';
         $category = $options['category'] ?? null;

         // Agresif Fisik
         if ($category === 'AGRESIF_FISIK' || preg_match('/(pukul|berkelahi|hantam|tendang|tampar|senjata|rokok|vape|narkoba|miras|aniaya)/', $lower)) {
             $isSevere = preg_match('/(senjata|narkoba|miras|berdarah|parah|keroyok)/', $lower);
             return [
                 'category' => 'AGRESIF_FISIK',
                 'severity' => $isSevere ? 'BERAT' : 'SEDANG',
                 'generated_narrative' => "{$studentName} terindikasi terlibat dalam perselisihan fisik atau pelanggaran keselamatan di lingkungan kelas. Perlu penanganan mediasi disiplin dan klarifikasi kronologi bersama pihak terkait.",
                 'ai_structured_summary' => 'Terlibat insiden fisik atau pelanggaran ketertiban sekolah.',
                 'suggested_action' => 'Pemisahan langsung, koordinasi orang tua, dan rujukan Guru BK.',
                 'suggested_participation' => 2,
                 'suggested_homework' => 3,
                 'suggested_quiz' => 3,
             ];
         }

         // Agresif Verbal / Bullying
         if ($category === 'AGRESIF_VERBAL' || preg_match('/(ejek|hina|maki|bentak|kata kotor|umpat|bully|ancam)/', $lower)) {
             return [
                 'category' => 'AGRESIF_VERBAL',
                 'severity' => str_contains($lower, 'ancam') || str_contains($lower, 'bully') ? 'SEDANG' : 'RINGAN',
                 'generated_narrative' => "{$studentName} menunjukkan ucapan atau komunikasi verbal yang kurang pantas kepada rekan sekelas saat jam pembelajaran. Wali kelas telah memberikan teguran lisan dan pembinaan etika bertutur.",
                 'ai_structured_summary' => 'Menunjukkan agresi verbal atau ketidaksopanan bertutur di kelas.',
                 'suggested_action' => 'Teguran lisan terstruktur dan bimbingan empati komunikasi.',
                 'suggested_participation' => 2,
                 'suggested_homework' => 3,
                 'suggested_quiz' => 3,
             ];
         }

         // Menarik Diri / Isu Emosional
         if ($category === 'MENARIK_DIRI' || preg_match('/(murung|diam|sendiri|menangis|isolasi|menutup diri|lemas|lesu|tidak mau bicara)/', $lower)) {
             return [
                 'category' => 'MENARIK_DIRI',
                 'severity' => str_contains($lower, 'menangis') || str_contains($lower, 'menutup diri') ? 'SEDANG' : 'RINGAN',
                 'generated_narrative' => "{$studentName} tampak lebih pendiam dari biasanya, pasif saat diskusi kelompok, dan cenderung menyendiri selama kegiatan kelas. Disarankan dialog personal santai dari wali kelas untuk mendalami kondisi emosionalnya.",
                 'ai_structured_summary' => 'Siswa tampak murung atau mengisolasi diri dari interaksi kelas.',
                 'suggested_action' => 'Pendekatan personal empati oleh wali kelas dan observasi berkala.',
                 'suggested_participation' => 1,
                 'suggested_homework' => 3,
                 'suggested_quiz' => 3,
             ];
         }

         // Perilaku Positif
         if ($category === 'PERILAKU_POSITIF' || preg_match('/(rajin|membantu|prestasi|aktif|inisiatif|sopan|memimpin|kerjasama)/', $lower)) {
             return [
                 'category' => 'PERILAKU_POSITIF',
                 'severity' => 'RINGAN',
                 'generated_narrative' => "{$studentName} menunjukkan inisiatif yang sangat baik dalam kegiatan belajar hari ini, aktif bertanya, serta membantu teman sekelompok menyelesaikan tugas tepat waktu.",
                 'ai_structured_summary' => 'Menunjukkan inisiatif positif dan partisipasi aktif yang inspiratif.',
                 'suggested_action' => 'Berikan apresiasi dan penguatan positif di hadapan kelas.',
                 'suggested_participation' => 5,
                 'suggested_homework' => 5,
                 'suggested_quiz' => 5,
             ];
         }

         // Tidak Fokus / Mengantuk (Default)
         if ($category === 'TIDAK_FOKUS' || preg_match('/(tidur|mengantuk|melamun|gadget|hp|main game|tidak fokus|tidak memperhatikan)/', $lower)) {
             return [
                 'category' => 'TIDAK_FOKUS',
                 'severity' => 'RINGAN',
                 'generated_narrative' => "{$studentName} terlihat kurang konsentrasi dan beberapa kali mengantuk saat penyampaian materi pelajaran. Wali kelas telah mengingatkan dan memeriksa kesiapan belajarnya.",
                 'ai_structured_summary' => 'Kurang fokus pada materi pembelajaran atau terdistraksi aktivitas lain.',
                 'suggested_action' => 'Pemberian interaksi aktif di kelas dan pengecekan pola istirahat malam.',
                 'suggested_participation' => 2,
                 'suggested_homework' => 3,
                 'suggested_quiz' => 3,
             ];
         }

         // Pelanggaran Aturan Umum
         return [
             'category' => 'PELANGGARAN_ATURAN',
             'severity' => 'RINGAN',
             'generated_narrative' => "{$studentName} terindikasi melakukan pelanggaran tata tertib kelas berupa ketidaklengkapan tugas atau ketidaktertiban waktu. Telah diberikan peringatan awal untuk memperbaiki komitmen belajar.",
             'ai_structured_summary' => 'Pelanggaran tata tertib umum atau deviasi kebiasaan belajar di kelas.',
             'suggested_action' => 'Teguran dan pencatatan dalam buku jurnal harian wali kelas.',
             'suggested_participation' => 3,
             'suggested_homework' => 2,
             'suggested_quiz' => 3,
         ];
     }

    /**
     * Structure and auto-complete BK counselor case / counseling session notes
     */
    public function structureBkObservation(string $rawText = '', array $options = []): array
    {
        $apiKey = config('services.ai.api_key') ?? config('services.gemini.api_key') ?? env('AI_API_KEY') ?? env('GEMINI_API_KEY');
        $endpoint = config('services.ai.endpoint') ?? config('services.gemini.endpoint') ?? env('AI_ENDPOINT') ?? env('GEMINI_ENDPOINT');
        $model = config('services.ai.model') ?? config('services.gemini.model') ?? env('AI_MODEL') ?? env('GEMINI_MODEL', 'gemini-2.5-flash');

        $inputText = !empty($rawText) ? $rawText : ($options['keywords'] ?? $options['preset_topic'] ?? $options['case_category'] ?? 'Sesi konseling umum');

        if (!empty($apiKey)) {
            try {
                $response = $this->callBkLlmApi($inputText, $apiKey, $model, $endpoint, $options);
                if ($response && isset($response['case_category'], $response['urgency_level'])) {
                    return $response;
                }
            } catch (\Throwable $e) {
                Log::warning('AI BK Text Structuring API failed, falling back to local heuristic generator', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $this->localBkFallbackStructuring($inputText, $options);
    }

    private function callBkLlmApi(string $rawText, string $apiKey, string $model = 'gemini-2.5-flash', ?string $endpoint = null, array $options = []): ?array
    {
        $studentName = $options['student_name'] ?? 'Siswa';
        $categoryHint = $options['case_category'] ?? $options['category'] ?? '';
        $urgencyHint = $options['urgency_level'] ?? $options['severity'] ?? '';

        $systemPrompt = <<<PROMPT
Anda adalah asisten AI Konselor Bimbingan & Konseling (Guru BK) Sekolah Menengah.
Tugas Anda: Mengubah catatan verbatim konseling, dinamika psikososial, atau kata kunci ringkas konselor menjadi:
1. Draf Catatan Sesi Konseling yang formal, mendalam, berwawasan psikososial, objektif, dan berpegang pada etika kerahasiaan konseling (2-3 kalimat/paragraf komprehensif).
2. Ringkasan dinamika psikososial siswa (maks 20 kata).
3. Rekomendasi langkah intervensi/tindak lanjut konseling yang aplikatif.

Kategori Kasus BK yang diizinkan:
- PSIKOSOSIAL_ADAPTASI (penyesuaian diri, kecemasan, isolasi, murung, masalah afektif)
- TEKANAN_AKADEMIK (stres beban belajar, burnout, penurunan motivasi, kecemasan ujian)
- KONFLIK_PEER (perselisihan teman sebaya, isolasi sosial, dinamika kelompok)
- KEDISIPLINAN_TATA_TERTIB (alpa berulang, membolos, keterlambatan kronis)
- MOTIVASI_KARIR (kebingungan peminatan jurusan, eksplorasi karir)
- DUGAAN_BULLYING (intimidasi verbal, perundungan fisik, cyberbullying)

Tingkat Urgensi yang diizinkan:
- RINGAN (konseling rutin / suportif berkala)
- SEDANG (pemantauan terarah dan konseling lanjutan)
- BERAT (kasus kritis / butuh rujukan / konferensi kasus dengan ortu & kepsek)

Format Output WAJIB berupa JSON murni tanpa pembungkus lain:
{
  "case_category": "KATEGORI_BK_TERPILIH",
  "urgency_level": "RINGAN / SEDANG / BERAT",
  "generated_narrative": "Draf catatan sesi konseling formal dan psikososial yang mendeskripsikan kondisi siswa, dinamika konseling, dan komitmen awal.",
  "psychosocial_summary": "Ringkasan dinamika psikososial siswa maks 20 kata.",
  "counselor_intervention": "Rekomendasi langkah intervensi atau tindak lanjut konselor."
}
PROMPT;

        $userContent = "Nama Siswa: {$studentName}\n" .
            ($categoryHint ? "Kategori Kasus Terpilih: {$categoryHint}\n" : "") .
            ($urgencyHint ? "Tingkat Urgensi: {$urgencyHint}\n" : "") .
            "Catatan / Dinamika Konseling:\n{$rawText}";

        $isOpenAiFormat = $endpoint && (
            str_contains($endpoint, '/chat/completions') ||
            str_contains($endpoint, '/v1') ||
            str_contains($endpoint, 'openrouter') ||
            str_contains($endpoint, 'groq') ||
            str_contains($endpoint, 'deepseek') ||
            str_contains($endpoint, 'openai') ||
            str_contains($endpoint, 'abc-tunnel')
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
                    'temperature' => 0.4,
                    'max_tokens' => 600,
                ]);

            if ($response->successful()) {
                $rawBody = $response->body();
                $content = '';

                if (str_contains($rawBody, 'data: {') || str_contains($rawBody, 'data:')) {
                    $lines = explode("\n", $rawBody);
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if (str_starts_with($line, 'data:')) {
                            $jsonChunk = trim(substr($line, 5));
                            if ($jsonChunk === '[DONE]') continue;
                            $chunkObj = json_decode($jsonChunk, true);
                            if (isset($chunkObj['choices'][0]['delta']['content'])) {
                                $content .= $chunkObj['choices'][0]['delta']['content'];
                            } elseif (isset($chunkObj['choices'][0]['text'])) {
                                $content .= $chunkObj['choices'][0]['text'];
                            }
                        }
                    }
                } else {
                    $data = $response->json();
                    $content = $data['choices'][0]['message']['content'] ?? '';
                }

                $content = preg_replace('/<think>.*?<\/think>/s', '', $content);
                $content = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
                $content = preg_replace('/\s*```$/', '', $content);

                $decoded = json_decode(trim($content), true);
                if (is_array($decoded) && isset($decoded['generated_narrative'])) {
                    return $decoded;
                }
            }
        }

        return null;
    }

    private function localBkFallbackStructuring(string $rawText, array $options = []): array
    {
        $lower = strtolower($rawText);
        $studentName = $options['student_name'] ?? 'Siswa';
        $category = $options['case_category'] ?? $options['category'] ?? null;

        if ($category === 'DUGAAN_BULLYING' || preg_match('/(bully|intimidasi|diejek|dipukul|ancam|dipalak|perundungan)/', $lower)) {
            return [
                'case_category' => 'DUGAAN_BULLYING',
                'urgency_level' => 'BERAT',
                'generated_narrative' => "Telah dilaksanakan sesi bimbingan konseling empatik bersama {$studentName} terkait indikasi pengalaman intimidasi di lingkungan sekolah. Siswa menyampaikan rasa tidak nyaman dan kecemasan saat berada di area tertentu. Konselor telah memberikan ruang aman, validasi emosi, serta menyusun rencana perlindungan terarah.",
                'psychosocial_summary' => 'Terindikasi mengalami intimidasi atau perundungan yang mempengaruhi rasa aman siswa.',
                'counselor_intervention' => 'Pendampingan psikososial intensif, mediasi tertutup, dan koordinasi bersama wali kelas serta pimpinan sekolah.',
            ];
        }

        if ($category === 'TEKANAN_AKADEMIK' || preg_match('/(nilai|stres|tugas|beban|ujian|burnout|lelah belajar|drop)/', $lower)) {
            return [
                'case_category' => 'TEKANAN_AKADEMIK',
                'urgency_level' => 'SEDANG',
                'generated_narrative' => "Sesi konseling difokuskan pada dinamika motivasi belajar {$studentName} yang mengeluhkan rasa kewalahan terhadap beban tugas dan tuntutan akademik. Siswa menunjukkan tanda kelelahan kognitif. Konselor mendampingi penyusunan strategi manajemen waktu dan teknik relaksasi mandiri.",
                'psychosocial_summary' => 'Mengalami stresor akademik dan penurunan efikasi diri dalam proses belajar.',
                'counselor_intervention' => 'Bimbingan regulasi diri, restrukturisasi jadwal belajar, dan komunikasi suportif bersama guru mata pelajaran.',
            ];
        }

        if ($category === 'KONFLIK_PEER' || preg_match('/(musuhan|teman|geng|kelompok|bertengkar|sindir|pecah)/', $lower)) {
            return [
                'case_category' => 'KONFLIK_PEER',
                'urgency_level' => 'SEDANG',
                'generated_narrative' => "Konselor menggali dinamika hubungan pertemanan {$studentName} yang mengalami hambatan komunikasi dan kesalahpahaman dengan rekan sebaya. Siswa menyepakati perlunya komunikasi asertif dan keterbukaan dalam menyelesaikan friksi pergaulan.",
                'psychosocial_summary' => 'Friksi komunikasi antarteman sebaya yang berdampak pada kenyamanan interaksi kelas.',
                'counselor_intervention' => 'Latihan komunikasi asertif, rencana mediasi suportif jika diperlukan, dan pemantauan interaksi kelas.',
            ];
        }

        if ($category === 'KEDISIPLINAN_TATA_TERTIB' || preg_match('/(alpa|bolos|terlambat|merokok|tata tertib|aturan)/', $lower)) {
            return [
                'case_category' => 'KEDISIPLINAN_TATA_TERTIB',
                'urgency_level' => 'SEDANG',
                'generated_narrative' => "Telah dilakukan konseling kedisiplinan konstruktif untuk mengeksplorasi akar penyebab ketidakhadiran dan keterlambatan {$studentName}. Siswa mengakui adanya kendala pola istirahat malam dan berkomitmen menandatangani kontrak perilaku kehadiran.",
                'psychosocial_summary' => 'Hambatan kedisiplinan kehadiran yang memerlukan pembiasaan tanggung jawab pribadi.',
                'counselor_intervention' => 'Pembuatan kontrak perilaku (behavior contract) dan konfirmasi perkembangan bersama orang tua.',
            ];
        }

        if ($category === 'MOTIVASI_KARIR' || preg_match('/(karir|jurusan|kuliah|minat|bakat|masa depan|bingung)/', $lower)) {
            return [
                'case_category' => 'MOTIVASI_KARIR',
                'urgency_level' => 'RINGAN',
                'generated_narrative' => "Sesi bimbingan karir mengeksplorasi minat, potensi, dan aspirasi lanjutan studi/karir {$studentName}. Dilakukan pemetaan peminatan dan diskusi alternatif pilihan jurusan yang selaras dengan profil kompetensi siswa.",
                'psychosocial_summary' => 'Eksplorasi peminatan studi lanjutan dan klarifikasi aspirasi karir masa depan.',
                'counselor_intervention' => 'Pemberian asesmen minat bakat mandiri dan bimbingan rencana aksi karir.',
            ];
        }

        // Default: PSIKOSOSIAL_ADAPTASI
        return [
            'case_category' => 'PSIKOSOSIAL_ADAPTASI',
            'urgency_level' => 'RINGAN',
            'generated_narrative' => "Konseling individu dilaksanakan untuk mendalami dinamika adaptasi dan suasana perasaan {$studentName}. Siswa diajak merefleksikan tantangan harian di sekolah dan menemukan strategi koping yang adaptif dalam menghadapi dinamika belajar.",
            'psychosocial_summary' => 'Proses adaptasi psikososial dan penguatan resiliensi emosi siswa di sekolah.',
            'counselor_intervention' => 'Konseling suportif rutin, latihan koping adaptif, dan observasi perkembangan afektif.',
        ];
    }
}
