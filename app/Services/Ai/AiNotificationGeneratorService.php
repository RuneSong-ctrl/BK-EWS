<?php

namespace App\Services\Ai;

use App\Models\CourseMapping;
use App\Models\EwsCourseAlert;
use App\Models\EwsNotification;
use App\Models\EwsStudentSummary;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiNotificationGeneratorService
{
    /**
     * Formulasi teks pesan WhatsApp untuk Guru Mata Pelajaran (Tier 1)
     */
    public function generateTier1Message(EwsCourseAlert $alert): string
    {
        $studentName = $alert->siswa?->name ?? 'Siswa Terdata';
        $teacherName = $alert->guru_pengampu ?: 'Bapak/Ibu Guru';
        $courseName = $alert->nama_mapel;
        $missingTasks = $alert->tugas_belum_dikumpul;
        $studyHours = number_format($alert->durasi_belajar_jam, 1);
        $kkm = $alert->kkm ?: 75;
        $riskLevel = $alert->tingkat_risiko;
        $dashboardUrl = url('/dashboard/guru-kelas');

        $prompt = <<<PROMPT
Anda adalah asisten cerdas sistem EWS Moodle SMKN 1 MAS.
Tugas Anda: Formulasikan pesan notifikasi WhatsApp singkat, to-the-point, dan profesional untuk Guru Mata Pelajaran.
Target Penerima: {$teacherName} (Guru Mapel: {$courseName})
Nama Siswa Berisiko: {$studentName}
Indikator Pembelajaran:
- Tingkat Risiko: {$riskLevel}
- Tugas Belum Dikumpul: {$missingTasks} tugas
- Durasi Belajar di LMS: {$studyHours} jam (Standar KKM: {$kkm})
- Catatan Rekomendasi: {$alert->rekomendasi_tindakan}
- Tautan Dashboard: {$dashboardUrl}

Ketentuan Pesan:
1. Awali dengan sapaan hormat ke {$teacherName}.
2. Laporkan secara lugas bahwa siswa {$studentName} membutuhkan perhatian pada mata pelajaran {$courseName}.
3. Sebutkan poin indikator kritisnya secara ringkas.
4. Sarankan langkah konkret: konfirmasi tugas susulan atau program remedial sebelum rekap nilai.
5. Cantumkan tautan dashboard di akhir pesan:
🔗 *Akses Dashboard Guru Mapel*:
{$dashboardUrl}
6. Maksimal 90-110 kata. Format menggunakan WhatsApp markdown (*teks tebal*).
7. Kembalikan HANYA teks pesan WhatsApp murni tanpa pengantar atau tanda kutip.
PROMPT;

        $aiText = $this->callLlmTextApi($prompt);

        if (!empty($aiText)) {
            return trim($aiText);
        }

        // Fallback Deterministik jika LLM offline
        return $this->fallbackTier1Message($alert);
    }

    /**
     * Formulasi teks notifikasi WhatsApp untuk Guru Bimbingan Konseling (Tier 2)
     */
    public function generateTier2Message(
        EwsStudentSummary $summary,
        ?string $referralNote = null,
        ?string $referralTeacher = null
    ): string {
        $studentName = $summary->siswa?->name ?? 'Siswa Terdata';
        $className = $summary->siswa?->classes?->first()?->name ?? 'Kelas Siswa';
        $riskCoursesCount = $summary->total_mapel_berisiko;
        $totalCourses = $summary->total_mapel_diambil;
        $studyProfile = $summary->profil_karakter_belajar;
        $inactiveDays = $summary->inaktivitas_terlama_hari;
        $priority = $summary->prioritas_konseling;
        $dashboardUrl = url('/dashboard/guru-bk');

        $extraContext = '';
        if ($referralNote && $referralTeacher) {
            $extraContext = "\n- Rujukan Langsung Dari: {$referralTeacher}\n- Catatan Rujukan: \"{$referralNote}\"";
        }

        $prompt = <<<PROMPT
Anda adalah asisten triage klinis EWS SMKN 1 MAS.
Tugas Anda: Formulasikan notifikasi WhatsApp profesional untuk Konselor Guru Bimbingan Konseling (Guru BK).
Target Penerima: Guru BK / Konselor Sekolah
Konteks Siswa:
- Nama: {$studentName} ({$className})
- Status Triage: PRIORITAS {$priority}
- Kendala Belajar: Terdeteksi pada {$riskCoursesCount} dari {$totalCourses} mata pelajaran
- Profil Karakter: {$studyProfile}
- Hari Inaktif LMS Moodle: {$inactiveDays} hari{$extraContext}
- Tautan Dashboard BK: {$dashboardUrl}

Ketentuan Pesan:
1. Awali dengan salam dan label triage EWS Tier 2.
2. Laporkan kondisi siswa {$studentName} ({$className}) yang membutuhkan intervensi/bimbingan klinis.
3. Sebutkan profil masalah utama dan ringkasan mapel terdampak.
4. Jika ada rujukan guru mapel, cantumkan secara singkat.
5. Sarankan untuk membuka Dashboard Guru BK dan menjadwalkan sesi bimbingan konseling individual dengan mencantumkan tautan:
🔗 *Akses Dashboard Guru BK*:
{$dashboardUrl}
6. Maksimal 100-120 kata. Format menggunakan WhatsApp markdown (*teks tebal*).
7. Kembalikan HANYA teks pesan WhatsApp murni tanpa pengantar atau tanda kutip.
PROMPT;

        $aiText = $this->callLlmTextApi($prompt);

        if (!empty($aiText)) {
            return trim($aiText);
        }

        // Fallback Deterministik jika LLM offline
        return $this->fallbackTier2Message($summary, $referralNote, $referralTeacher);
    }

    /**
     * Buat notifikasi Tier 1 (Guru Mapel) dan simpan ke antrean ews_notifications
     */
    public function createNotificationForTier1(EwsCourseAlert $alert): EwsNotification
    {
        // Cari nomor WhatsApp guru mapel dari course_mappings atau users
        $courseMapping = CourseMapping::where('code_module', $alert->kode_modul)->first();
        $targetUser = User::where('name', 'like', '%' . $alert->guru_pengampu . '%')->first();

        $phone = $courseMapping?->no_wa_guru ?: ($targetUser?->phone ?: '6281234567890');
        $messageText = $this->generateTier1Message($alert);

        return EwsNotification::create([
            'target_user_id' => $targetUser?->id,
            'alert_id' => $alert->id,
            'summary_id' => null,
            'recipient_type' => 'guru_mapel',
            'recipient_name' => $alert->guru_pengampu ?: ($targetUser?->name ?: 'Guru Mata Pelajaran'),
            'recipient_phone' => $this->normalizePhoneNumber($phone),
            'risk_level' => $alert->tingkat_risiko,
            'message_type' => 'ai_generated',
            'message_text' => $messageText,
            'status' => 'pending',
            'scheduled_at' => now(),
        ]);
    }

    /**
     * Buat notifikasi Tier 2 (Guru BK) dan simpan ke antrean ews_notifications
     */
    public function createNotificationForTier2(
        EwsStudentSummary $summary,
        ?string $referralNote = null,
        ?string $referralTeacher = null
    ): EwsNotification {
        // Cari nomor WhatsApp Guru BK
        $guruBk = User::where('role', 'guru_bk')->first();
        $phone = $guruBk?->phone ?: config('services.ews.bk_phone', '6281987654321');
        $messageText = $this->generateTier2Message($summary, $referralNote, $referralTeacher);

        return EwsNotification::create([
            'target_user_id' => $guruBk?->id,
            'alert_id' => null,
            'summary_id' => $summary->id,
            'recipient_type' => 'guru_bk',
            'recipient_name' => $guruBk?->name ?: 'Guru Bimbingan Konseling',
            'recipient_phone' => $this->normalizePhoneNumber($phone),
            'risk_level' => $summary->prioritas_konseling === 'TINGGI' ? 'TINGGI' : ($summary->prioritas_konseling === 'SEDANG' ? 'SEDANG' : 'RENDAH'),
            'message_type' => 'ai_generated',
            'message_text' => $messageText,
            'status' => 'pending',
            'scheduled_at' => now(),
        ]);
    }

    /**
     * Panggilan HTTP generik ke LLM (Gemini REST atau OpenAI compatible endpoint)
     */
    private function callLlmTextApi(string $prompt): ?string
    {
        $apiKey = config('services.gemini.api_key') ?? config('services.ai.api_key') ?? env('GEMINI_API_KEY') ?? env('AI_API_KEY');
        $model = config('services.gemini.model') ?? config('services.ai.model') ?? env('GEMINI_MODEL') ?? env('AI_MODEL', 'gemini-2.5-flash');
        $endpoint = config('services.ai.endpoint') ?? config('services.gemini.endpoint') ?? env('AI_ENDPOINT') ?? env('GEMINI_ENDPOINT');

        if (empty($apiKey) && empty($endpoint)) {
            return null;
        }

        try {
            $isOpenAi = $endpoint && (
                str_contains($endpoint, '/chat/completions') ||
                str_contains($endpoint, '/v1') ||
                str_contains($endpoint, 'openai') ||
                str_contains($endpoint, 'groq') ||
                str_contains($endpoint, 'openrouter')
            );

            if ($isOpenAi) {
                $url = str_ends_with($endpoint, '/chat/completions') ? $endpoint : rtrim($endpoint, '/') . '/chat/completions';
                $response = Http::withoutVerifying()
                    ->withHeaders([
                        'Authorization' => "Bearer {$apiKey}",
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(15)
                    ->post($url, [
                        'model' => $model,
                        'messages' => [
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.4,
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    return $json['choices'][0]['message']['content'] ?? null;
                }
            } else {
                // Default: Google Gemini REST API v1beta
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $response = Http::withoutVerifying()
                    ->timeout(15)
                    ->post($url, [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => $prompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.4,
                        ],
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    return $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('LLM Notification Generator call failed: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Fallback format teks untuk Guru Mapel jika offline
     */
    private function fallbackTier1Message(EwsCourseAlert $alert): string
    {
        $studentName = $alert->siswa?->name ?? 'Siswa Terdata';
        $teacherName = $alert->guru_pengampu ?: 'Bapak/Ibu Guru';
        $courseName = $alert->nama_mapel;
        $missingTasks = $alert->tugas_belum_dikumpul;
        $studyHours = number_format($alert->durasi_belajar_jam, 1);
        $kkm = $alert->kkm ?: 75;
        $dashboardUrl = url('/dashboard/guru-kelas');

        return "📢 *[EWS ALERT TIER 1 - SMKN 1 MAS]*\n\n" .
            "Yth. *{$teacherName}*,\n" .
            "Sistem deteksi dini Moodle mendeteksi indikator risiko belajar pada siswa berikut:\n\n" .
            "👤 *Nama Siswa*: {$studentName}\n" .
            "📚 *Mata Pelajaran*: {$courseName} (KKM: {$kkm})\n" .
            "⚠️ *Indikator*: {$missingTasks} tugas belum dikumpul, durasi belajar LMS {$studyHours} jam.\n\n" .
            "Mohon kesediaan Bapak/Ibu untuk mengonfirmasi tugas susulan atau mengagendakan program remedial.\n\n" .
            "🔗 *Akses Dashboard Guru Mapel*:\n{$dashboardUrl}";
    }

    /**
     * Fallback format teks untuk Guru BK jika offline
     */
    private function fallbackTier2Message(
        EwsStudentSummary $summary,
        ?string $referralNote = null,
        ?string $referralTeacher = null
    ): string {
        $studentName = $summary->siswa?->name ?? 'Siswa Terdata';
        $className = $summary->siswa?->classes?->first()?->name ?? 'Kelas Siswa';
        $riskCount = $summary->total_mapel_berisiko;
        $totalCount = $summary->total_mapel_diambil;
        $profile = $summary->profil_karakter_belajar;
        $priority = $summary->prioritas_konseling;
        $dashboardUrl = url('/dashboard/guru-bk');

        $msg = "🛡️ *[TRIAGE EWS TIER 2 - RUANG BK]*\n\n" .
            "Yth. *Konselor Bimbingan Konseling*,\n" .
            "Terdapat siswa yang memerlukan penanganan konseling tingkat *PRIORITAS {$priority}*:\n\n" .
            "👤 *Nama*: {$studentName} ({$className})\n" .
            "📊 *Status*: Berisiko pada {$riskCount} dari {$totalCount} mata pelajaran\n" .
            "🔍 *Profil Belajar*: {$profile}\n";

        if ($referralTeacher && $referralNote) {
            $msg .= "📌 *Rujukan Guru*: {$referralTeacher} - \"{$referralNote}\"\n";
        }

        $msg .= "\nMohon jadwalkan sesi wawancara konseling individual atau tindak lanjut.\n\n" .
            "🔗 *Akses Dashboard Guru BK*:\n{$dashboardUrl}";
        return $msg;
    }

    /**
     * Normalisasi nomor telepon ke format WhatsApp internasional (misal: 0812 -> 62812)
     */
    private function normalizePhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleaned, '0')) {
            return '62' . substr($cleaned, 1);
        }
        if (str_starts_with($cleaned, '8')) {
            return '62' . $cleaned;
        }
        return $cleaned;
    }
}
