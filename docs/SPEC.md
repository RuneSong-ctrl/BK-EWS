# Technical Specification (SPEC.md)
# Sistem Informasi Bimbingan Konseling (BK) dengan AI Early Warning System (EWS)

| Atribut Dokumen | Keterangan |
|---|---|
| **Dokumen Terkait** | [PRD_Sistem_BK_EWS_AI.md](file:///c:/Users/ramad/Documents/PROJECT/BK-EWS/docs/PRD_Sistem_BK_EWS_AI.md) |
| **Versi Dokumen** | 1.0 (Production-Ready Technical Spec) |
| **Tanggal Rilis** | 14 Agustus 2026 |
| **Target Implementasi** | Laravel 13, Inertia.js (React 19 + TypeScript), Tailwind CSS v4, PostgreSQL/MySQL, LLM API |

---

## 1. Arsitektur Sistem & Blueprint Teknis

```mermaid
graph TB
    subgraph Client_Layer["Client Layer (Inertia.js React 19 + TypeScript)"]
        UI_GK[Dashboard Guru Kelas]
        UI_GBK[Dashboard Guru BK]
        UI_KS[Dashboard Kepala Sekolah]
        UI_Modal[AI Human-in-the-Loop Modal]
    end

    subgraph HTTP_Security["HTTP & Security Layer (Laravel 13)"]
        Route[Inertia / Web Routes]
        AuthMid[Authenticate Middleware]
        RoleMid[RoleScopeMiddleware]
        AuditMid[AuditLogMiddleware]
    end

    subgraph Service_Domain["Domain & Application Service Layer"]
        EwsService[EwsScoringService<br/>(Deterministic Engine)]
        AiStructService[AiTextStructuringService<br/>(SLA < 4s)]
        AiAdvisorService[AiAdvisorService<br/>(Contextual Narrative)]
        AnonService[DataPseudonymizationService<br/>(UU PDP Layer)]
    end

    subgraph Async_Queue["Background Job & Queue (Database / Redis)"]
        Job_EWS[RecalculateStudentEwsJob]
        Job_AI[GenerateAiAdvisorAnalysisJob]
    end

    subgraph Data_Storage["Data Storage & Persistence"]
        DB[(RDBMS: MySQL / PostgreSQL)]
        EncModel[AES-256 Model Encrypted Columns]
        LLM_API[External LLM Service: Gemini / OpenAI]
    end

    Client_Layer --> Route
    Route --> AuthMid --> RoleMid --> AuditMid
    RoleMid --> EwsService
    RoleMid --> AiStructService
    RoleMid --> AiAdvisorService

    EwsService --> DB
    AiStructService --> LLM_API
    AiAdvisorService --> AnonService --> LLM_API

    EwsService -.->|Trigger Event| Job_EWS
    Job_EWS --> Job_AI
    Job_AI --> DB

    DB --- EncModel
```

---

## 2. Skema Basis Data & Migrasi (Database Schema & Migration Specs)

### 2.1 Konvensi & Aturan Enkripsi Kolom
Sesuai kepatuhan **UU PDP**, kolom teks mentah observasi perilaku dan catatan rahasia kasus BK dienkripsi menggunakan fitur bawaan Laravel Model Encryption (`casts = ['column' => 'encrypted']`).

### 2.2 Tabel & Definisi Kolom

#### Tabel: `users`
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nip VARCHAR(50) UNIQUE NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('guru_kelas', 'guru_bk', 'kepsek') NOT NULL DEFAULT 'guru_kelas',
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### Tabel: `classes`
```sql
CREATE TABLE classes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Contoh: '10-MIPA-1'
    grade_level TINYINT UNSIGNED NOT NULL, -- 10, 11, atau 12
    homeroom_teacher_id BIGINT UNSIGNED NOT NULL,
    academic_year VARCHAR(20) NOT NULL, -- Contoh: '2026/2027'
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
);
```

#### Tabel: `students`
```sql
CREATE TABLE students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nis VARCHAR(50) UNIQUE NOT NULL,
    nisn VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    gender ENUM('L', 'P') NOT NULL,
    status ENUM('AKTIF', 'LULUS', 'PINDAH', 'NON_AKTIF') NOT NULL DEFAULT 'AKTIF',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL -- SoftDeletes
);
```

#### Tabel: `class_enrollments`
```sql
CREATE TABLE class_enrollments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_student_year (student_id, academic_year)
);
```

#### Tabel: `subjects`
```sql
CREATE TABLE subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- 'MAT-WAJIB', 'BINDO'
    name VARCHAR(100) NOT NULL,
    passing_grade DECIMAL(5,2) NOT NULL DEFAULT 75.00,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### Tabel: `academic_records`
```sql
CREATE TABLE academic_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    subject_id BIGINT UNSIGNED NOT NULL,
    assessment_type ENUM('TUGAS', 'UH', 'UTS', 'UAS') NOT NULL,
    period VARCHAR(50) NOT NULL, -- 'Semester 1 - UTS'
    academic_year VARCHAR(20) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    is_remedial BOOLEAN NOT NULL DEFAULT FALSE,
    previous_score DECIMAL(5,2) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_student_academic (student_id, academic_year, period)
);
```

#### Tabel: `attendance_records`
```sql
CREATE TABLE attendance_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    status ENUM('HADIR', 'SAKIT', 'IZIN', 'ALPA', 'TERLAMBAT') NOT NULL,
    check_in_time TIME NULL,
    late_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    notes VARCHAR(255) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_student_date (student_id, date),
    INDEX idx_attendance_date (date, status)
);
```

#### Tabel: `behavior_observations`
```sql
CREATE TABLE behavior_observations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    category ENUM('MENARIK_DIRI', 'AGRESIF_FISIK', 'AGRESIF_VERBAL', 'TIDAK_FOKUS', 'PELANGGARAN_ATURAN', 'PERILAKU_POSITIF') NOT NULL,
    severity ENUM('RINGAN', 'SEDANG', 'BERAT') NOT NULL DEFAULT 'RINGAN',
    raw_text TEXT NOT NULL, -- Cast: 'encrypted'
    ai_structured_summary VARCHAR(255) NOT NULL,
    confirmed_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_behavior_student (student_id, date, severity)
);
```

#### Tabel: `bk_cases`
```sql
CREATE TABLE bk_cases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    incident_date DATE NOT NULL,
    reported_date DATE NOT NULL,
    case_types JSON NOT NULL, -- e.g. ["BULLYING", "KEKERASAN_FISIK"]
    bullying_role ENUM('KORBAN', 'PELAKU', 'SAKSI') NULL,
    severity ENUM('RINGAN', 'SEDANG', 'BERAT') NOT NULL DEFAULT 'RINGAN',
    status ENUM('BARU_DILAPORKAN', 'DALAM_PROSES', 'DIESKALASI_KE_KEPSEK', 'DIRUJUK_EKSTERNAL', 'SELESAI') NOT NULL DEFAULT 'BARU_DILAPORKAN',
    follow_up_actions JSON NOT NULL, -- e.g. ["PANGGILAN_ORANG_TUA", "MEDIASI_PEER"]
    involved_students_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    confidential_notes TEXT NULL, -- Cast: 'encrypted'
    handled_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_bk_severity_status (severity, status)
);
```

#### Tabel: `ews_scores` & `ews_score_history`
```sql
CREATE TABLE ews_scores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL UNIQUE,
    status ENUM('DATA_BELUM_LENGKAP', 'NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS') NOT NULL DEFAULT 'DATA_BELUM_LENGKAP',
    academic_sub_status ENUM('NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING') NOT NULL DEFAULT 'PENDING',
    attendance_sub_status ENUM('NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING') NOT NULL DEFAULT 'PENDING',
    behavior_sub_status ENUM('NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING') NOT NULL DEFAULT 'PENDING',
    bk_sub_status ENUM('NORMAL', 'BERISIKO', 'WASPADA', 'KRITIS', 'PENDING') NOT NULL DEFAULT 'PENDING',
    triggered_by_parameters JSON NOT NULL, -- Array of trigger codes
    calculated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE ews_score_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    trigger_reasons JSON NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_history_student (student_id, recorded_at)
);
```

#### Tabel: `ai_analysis_logs` & `audit_logs`
```sql
CREATE TABLE ai_analysis_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    ews_score_id BIGINT UNSIGNED NOT NULL,
    risk_overview TEXT NOT NULL,
    primary_concerns JSON NOT NULL,
    recommendations JSON NOT NULL,
    data_limitation_note TEXT NULL,
    model_version VARCHAR(50) NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (ews_score_id) REFERENCES ews_scores(id) ON DELETE CASCADE,
    INDEX idx_ai_student (student_id, generated_at)
);

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'VIEW_CONFIDENTIAL_BK_CASE'
    target_resource VARCHAR(100) NOT NULL, -- e.g. 'bk_cases'
    resource_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_audit_user (user_id, created_at)
);
```

---

## 3. Eloquent Models & Query Isolation Scopes

### 3.1 Model `BkCase.php` (Query Scoping untuk Kepsek)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class BkCase extends Model
{
    protected $casts = [
        'case_types' => 'array',
        'follow_up_actions' => 'array',
        'confidential_notes' => 'encrypted',
        'incident_date' => 'date',
        'reported_date' => 'date',
    ];

    /**
     * Scope untuk menegakkan hak akses berbasis role (UU PDP Governance)
     */
    public function scopeAccessibleBy(Builder $query, User $user): Builder
    {
        if ($user->isGuruBk()) {
            return $query; // Guru BK melihat semua kasus
        }

        if ($user->isKepsek()) {
            // Kepsek HANYA melihat kasus Berat, Dieskalasi, atau Siswa berstatus Waspada/Kritis
            return $query->where(function (Builder $q) {
                $q->where('severity', 'BERAT')
                  ->orWhere('status', 'DIESKALASI_KE_KEPSEK')
                  ->orWhereHas('student.ewsScore', function (Builder $sq) {
                      $sq->whereIn('status', ['WASPADA', 'KRITIS']);
                  });
            });
        }

        // Guru Kelas dilarang melihat data kasus BK secara langsung
        return $query->whereRaw('1 = 0');
    }
}
```

---

## 4. Spesifikasi Mesin Skoring Deterministik EWS

### 4.1 Algoritma Kalkulasi `EwsScoringService.php`

```php
namespace App\Services\Ews;

use App\Models\Student;
use App\Models\EwsScore;
use App\Models\EwsScoreHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EwsScoringService
{
    const STATUS_DATA_BELUM_LENGKAP = 'DATA_BELUM_LENGKAP';
    const STATUS_NORMAL = 'NORMAL';
    const STATUS_BERISIKO = 'BERISIKO';
    const STATUS_WASPADA = 'WASPADA';
    const STATUS_KRITIS = 'KRITIS';

    private array $severityRank = [
        'PENDING' => 0,
        'NORMAL' => 1,
        'BERISIKO' => 2,
        'WASPADA' => 3,
        'KRITIS' => 4,
    ];

    public function evaluate(Student $student): EwsScore
    {
        $triggers = [];

        // 1. Evaluasi Pilar Akademik
        $academicResult = $this->evaluateAcademic($student);
        if ($academicResult['trigger']) $triggers[] = $academicResult['trigger'];

        // 2. Evaluasi Pilar Kehadiran
        $attendanceResult = $this->evaluateAttendance($student);
        if ($attendanceResult['trigger']) $triggers[] = $attendanceResult['trigger'];

        // 3. Evaluasi Pilar Perilaku
        $behaviorResult = $this->evaluateBehavior($student);
        if ($behaviorResult['trigger']) $triggers[] = $behaviorResult['trigger'];

        // 4. Evaluasi Pilar Kasus BK
        $bkResult = $this->evaluateBkCases($student);
        if ($bkResult['trigger']) $triggers[] = $bkResult['trigger'];

        // 5. Emergency Override: Jika ada kasus BK Berat atau Alpa > 5 Hari -> Langsung KRITIS
        $isEmergencyCritical = ($bkResult['sub_status'] === self::STATUS_KRITIS) 
                            || ($attendanceResult['sub_status'] === self::STATUS_KRITIS);

        // 6. Data Completeness Gate
        $isDataComplete = ($academicResult['sub_status'] !== 'PENDING') 
                       && ($attendanceResult['sub_status'] !== 'PENDING');

        if (!$isDataComplete && !$isEmergencyCritical) {
            $finalStatus = self::STATUS_DATA_BELUM_LENGKAP;
        } else {
            // Algoritma Max-Severity (Worst-Case Paradigm)
            $statuses = [
                $academicResult['sub_status'],
                $attendanceResult['sub_status'],
                $behaviorResult['sub_status'],
                $bkResult['sub_status'],
            ];

            $maxRank = 1;
            $finalStatus = self::STATUS_NORMAL;

            foreach ($statuses as $st) {
                $rank = $this->severityRank[$st] ?? 0;
                if ($rank > $maxRank) {
                    $maxRank = $rank;
                    $finalStatus = $st;
                }
            }
        }

        // 7. Simpan Skor & Catat Riwayat Transisi Status
        return $this->persistScore($student, $finalStatus, [
            'academic' => $academicResult['sub_status'],
            'attendance' => $attendanceResult['sub_status'],
            'behavior' => $behaviorResult['sub_status'],
            'bk' => $bkResult['sub_status'],
            'triggers' => $triggers,
        ]);
    }

    private function evaluateAcademic(Student $student): array
    {
        $records = $student->academicRecords()
            ->latest('created_at')
            ->take(10)
            ->get();

        if ($records->count() < 2) {
            return ['sub_status' => 'PENDING', 'trigger' => null];
        }

        $avgScore = $records->avg('score');
        
        // Cek tren penurunan (2 periode berturut-turut)
        $isDecreasingTrend = false;
        if ($records->count() >= 3) {
            $s1 = $records[0]->score;
            $s2 = $records[1]->score;
            $s3 = $records[2]->score;
            if ($s1 < $s2 && $s2 < $s3) {
                $isDecreasingTrend = true;
            }
        }

        if ($avgScore < 50.0) {
            return ['sub_status' => self::STATUS_KRITIS, 'trigger' => 'AKADEMIK_RATA_RATA_DIBAWAH_50'];
        } elseif ($avgScore < 65.0 || $isDecreasingTrend) {
            return ['sub_status' => self::STATUS_WASPADA, 'trigger' => $isDecreasingTrend ? 'AKADEMIK_TREN_TURUN_BERUNTUN' : 'AKADEMIK_RATA_RATA_DIBAWAH_65'];
        } elseif ($avgScore < 75.0) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'AKADEMIK_RATA_RATA_DIBAWAH_KKM'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    private function evaluateAttendance(Student $student): array
    {
        $thirtyDaysAgo = Carbon::today()->subDays(30);
        $records = $student->attendanceRecords()
            ->where('date', '>=', $thirtyDaysAgo)
            ->orderBy('date', 'desc')
            ->get();

        if ($records->count() < 5) {
            return ['sub_status' => 'PENDING', 'trigger' => null];
        }

        // Hitung Alpa Berturut-turut
        $consecutiveAlpha = 0;
        foreach ($records as $rec) {
            if ($rec->status === 'ALPA') {
                $consecutiveAlpha++;
            } else {
                break;
            }
        }

        $totalRecords = $records->count();
        $presentCount = $records->whereIn('status', ['HADIR', 'TERLAMBAT'])->count();
        $rate = ($presentCount / $totalRecords) * 100;

        if ($consecutiveAlpha > 5 || $rate < 80.0) {
            return ['sub_status' => self::STATUS_KRITIS, 'trigger' => $consecutiveAlpha > 5 ? 'ALPA_LEBIH_DARI_5_HARI' : 'KEHADIRAN_DIBAWAH_80_PERSEN'];
        } elseif ($consecutiveAlpha >= 3 || $rate < 90.0) {
            return ['sub_status' => self::STATUS_WASPADA, 'trigger' => $consecutiveAlpha >= 3 ? 'ALPA_3_SAMPAI_5_HARI' : 'KEHADIRAN_DIBAWAH_90_PERSEN'];
        } elseif ($consecutiveAlpha >= 1 || $rate < 95.0) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'ALPA_1_SAMPAI_2_HARI'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    private function evaluateBehavior(Student $student): array
    {
        $observations = $student->behaviorObservations()
            ->where('date', '>=', Carbon::today()->subMonths(6))
            ->get();

        $beratCount = $observations->where('severity', 'BERAT')->count();
        $sedangCount = $observations->where('severity', 'SEDANG')->count();
        $ringanCount = $observations->where('severity', 'RINGAN')->count();

        if ($beratCount >= 1 || $sedangCount >= 2 || $ringanCount > 5) {
            return ['sub_status' => self::STATUS_KRITIS, 'trigger' => 'PERILAKU_PELANGGARAN_BERAT_ATAU_BERULANG'];
        } elseif ($sedangCount >= 1 || $ringanCount >= 3) {
            return ['sub_status' => self::STATUS_WASPADA, 'trigger' => 'PERILAKU_PELANGGARAN_SEDANG'];
        } elseif ($ringanCount >= 1) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'PERILAKU_PELANGGARAN_RINGAN'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    private function evaluateBkCases(Student $student): array
    {
        $activeCases = $student->bkCases()
            ->whereIn('status', ['BARU_DILAPORKAN', 'DALAM_PROSES', 'DIESKALASI_KE_KEPSEK'])
            ->get();

        if ($activeCases->contains('severity', 'BERAT') || $activeCases->contains('status', 'DIESKALASI_KE_KEPSEK')) {
            return ['sub_status' => self::STATUS_KRITIS, 'trigger' => 'BK_KASUS_BERAT_ATAU_DIESKALASI'];
        } elseif ($activeCases->contains('severity', 'SEDANG') || $activeCases->where('severity', 'RINGAN')->count() >= 2) {
            return ['sub_status' => self::STATUS_WASPADA, 'trigger' => 'BK_KASUS_SEDANG_AKTIF'];
        } elseif ($activeCases->where('severity', 'RINGAN')->count() === 1) {
            return ['sub_status' => self::STATUS_BERISIKO, 'trigger' => 'BK_KASUS_RINGAN_AKTIF'];
        }

        return ['sub_status' => self::STATUS_NORMAL, 'trigger' => null];
    }

    private function persistScore(Student $student, string $finalStatus, array $detail): EwsScore
    {
        return DB::transaction(function () use ($student, $finalStatus, $detail) {
            $existing = EwsScore::where('student_id', $student->id)->first();
            $oldStatus = $existing ? $existing->status : 'BELUM_ADA';

            $score = EwsScore::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'status' => $finalStatus,
                    'academic_sub_status' => $detail['academic'],
                    'attendance_sub_status' => $detail['attendance'],
                    'behavior_sub_status' => $detail['behavior'],
                    'bk_sub_status' => $detail['bk'],
                    'triggered_by_parameters' => $detail['triggers'],
                    'calculated_at' => Carbon::now(),
                ]
            );

            if ($oldStatus !== $finalStatus) {
                EwsScoreHistory::create([
                    'student_id' => $student->id,
                    'old_status' => $oldStatus,
                    'new_status' => $finalStatus,
                    'trigger_reasons' => $detail['triggers'],
                    'recorded_at' => Carbon::now(),
                ]);
            }

            return $score;
        });
    }
}
```

---

## 5. Integrasi Layanan AI (Prompt Contracts & Pseudonymization)

### 5.1 Service: `DataPseudonymizationService.php` (UU PDP Guard)
```php
namespace App\Services\Ai;

use App\Models\Student;

class DataPseudonymizationService
{
    public function sanitizeForPrompt(Student $student): array
    {
        // NISN dan Nama Asli TIDAK dikirim ke LLM
        return [
            'pseudo_id' => 'SISWA-' . substr(hash('sha256', $student->id . config('app.key')), 0, 8),
            'gender' => $student->gender === 'L' ? 'Laki-laki' : 'Perempuan',
            'grade_level' => optional($student->currentClass())->name ?? 'Kelas X',
        ];
    }
}
```

### 5.2 Service: `AiTextStructuringService.php`
- **SLA:** Timeout `5000ms`.
- **System Prompt:**
```text
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

Output WAJIB berupa JSON murni tanpa markdown pembungkus:
{
  "category": "...",
  "severity": "...",
  "ai_structured_summary": "Ringkasan formal maks 20 kata",
  "suggested_action": "Saran tindak lanjut singkat"
}
```

### 5.3 Service: `AiAdvisorService.php`
- **Trigger:** Dipanggil melalui asynchronous job `GenerateAiAdvisorAnalysisJob.php` saat skor EWS berubah menjadi `WASPADA` atau `KRITIS`.
- **System Prompt:**
```text
Anda adalah Konsultan Ahli Bimbingan Konseling dan Early Warning System Sekolah.
Analisis data agregat siswa berikut (data telah dianonimkan) dan berikan saran terarah untuk Guru Kelas, Guru BK, dan Kepala Sekolah.

Format Output JSON:
{
  "risk_overview": "Analisis akar masalah 2-3 kalimat",
  "primary_concerns": ["Poin perhatian utama 1", "Poin perhatian utama 2"],
  "recommendations": {
    "for_homeroom_teacher": "Aksi spesifik untuk wali kelas",
    "for_counselor_bk": "Aksi intervensi/konseling untuk BK",
    "for_principal": "Arah monitoring manajerial untuk Kepsek"
  },
  "data_limitation_note": "Catatan jika data belum lengkap"
}
```

---

## 6. Rute & Kontrak API / Controller (Inertia Routing)

### 6.1 Route Inventory

| HTTP Method | URI | Controller & Action | Middleware | Deskripsi |
|---|---|---|---|---|
| `GET` | `/` | `DashboardController@index` | `auth` | Redirect ke dashboard sesuai role |
| `GET` | `/guru-kelas/dashboard` | `GuruKelas\DashboardController@index` | `auth, role:guru_kelas` | List siswa di kelasnya + status EWS |
| `POST` | `/guru-kelas/observations/ai-structure` | `GuruKelas\ObservationController@structureWithAi` | `auth, role:guru_kelas` | API Autocomplete Structuring |
| `POST` | `/guru-kelas/observations` | `GuruKelas\ObservationController@store` | `auth, role:guru_kelas` | Simpan Observasi Terkonfirmasi |
| `POST` | `/guru-kelas/attendance/bulk` | `GuruKelas\AttendanceController@storeBulk` | `auth, role:guru_kelas` | Input Absensi Harian Kelas |
| `POST` | `/guru-kelas/academics` | `GuruKelas\AcademicController@store` | `auth, role:guru_kelas` | Input Nilai Mata Pelajaran |
| `GET` | `/guru-bk/dashboard` | `GuruBK\DashboardController@index` | `auth, role:guru_bk` | Matriks EWS seluruh siswa + Filter |
| `GET` | `/guru-bk/students/{student}` | `GuruBK\StudentProfileController@show` | `auth, role:guru_bk` | Profil Holistik & AI Advisor |
| `POST` | `/guru-bk/cases` | `GuruBK\CaseController@store` | `auth, role:guru_bk` | Input Kasus Bimbingan Konseling |
| `PATCH` | `/guru-bk/cases/{case}/status` | `GuruBK\CaseController@updateStatus` | `auth, role:guru_bk` | Update Status Penanganan Kasus |
| `GET` | `/kepsek/dashboard` | `Kepsek\DashboardController@index` | `auth, role:kepsek` | Executive Summary & Threshold Alert |
| `GET` | `/kepsek/students/{student}` | `Kepsek\StudentMonitorController@show` | `auth, role:kepsek` | Drill-down Siswa Kritis (+ Audit Log) |

---

## 7. Kontrak Tipe Frontend (TypeScript Interfaces)

File: `resources/js/types/ews.d.ts`

```typescript
export type UserRole = 'guru_kelas' | 'guru_bk' | 'kepsek';

export type EwsStatus = 'DATA_BELUM_LENGKAP' | 'NORMAL' | 'BERISIKO' | 'WASPADA' | 'KRITIS';

export type SeverityLevel = 'RINGAN' | 'SEDANG' | 'BERAT';

export interface Student {
    id: number;
    nis: string;
    nisn: string;
    name: string;
    gender: 'L' | 'P';
    class_name?: string;
    ews_score?: EwsScore;
}

export interface EwsScore {
    id: number;
    student_id: number;
    status: EwsStatus;
    academic_sub_status: EwsStatus | 'PENDING';
    attendance_sub_status: EwsStatus | 'PENDING';
    behavior_sub_status: EwsStatus | 'PENDING';
    bk_sub_status: EwsStatus | 'PENDING';
    triggered_by_parameters: string[];
    calculated_at: string;
}

export interface AiStructureResponse {
    category: string;
    severity: SeverityLevel;
    ai_structured_summary: string;
    suggested_action: string;
}

export interface AiAdvisorAnalysis {
    risk_overview: string;
    primary_concerns: string[];
    recommendations: {
        for_homeroom_teacher: string;
        for_counselor_bk: string;
        for_principal: string;
    };
    data_limitation_note?: string;
    model_version: string;
    generated_at: string;
}
```

---

## 8. Spesifikasi Pengujian Otomatis (Automated Testing Suite)

### 8.1 Unit Test: `EwsScoringServiceTest.php`
- `test_student_with_no_data_returns_data_belum_lengkap()`
- `test_student_with_consecutive_alpha_greater_than_5_triggers_kritis()`
- `test_student_with_good_grades_but_critical_bk_case_evaluates_to_kritis()`
- `test_null_academic_scores_are_safely_ignored_and_not_treated_as_zero()`

### 8.2 Feature Test: `GovernanceAndSecurityTest.php`
- `test_kepsek_cannot_view_light_confidential_bk_case_notes()`
- `test_viewing_critical_case_by_kepsek_creates_audit_log_entry()`
- `test_guru_kelas_cannot_access_other_classes_students()`
- `test_raw_behavior_observation_text_is_encrypted_in_database()`

---

## 9. Struktur Folder Implementasi

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── GuruKelas/
│   │   │   ├── DashboardController.php
│   │   │   ├── ObservationController.php
│   │   │   └── AttendanceController.php
│   │   ├── GuruBK/
│   │   │   ├── DashboardController.php
│   │   │   ├── StudentProfileController.php
│   │   │   └── CaseController.php
│   │   └── Kepsek/
│   │       ├── DashboardController.php
│   │       └── StudentMonitorController.php
│   └── Middleware/
│       ├── CheckRole.php
│       └── LogAuditableAction.php
├── Models/
│   ├── Student.php
│   ├── BkCase.php
│   ├── EwsScore.php
│   ├── BehaviorObservation.php
│   └── AuditLog.php
├── Services/
│   ├── Ews/
│   │   └── EwsScoringService.php
│   └── Ai/
│       ├── AiTextStructuringService.php
│       ├── AiAdvisorService.php
│       └── DataPseudonymizationService.php
└── Jobs/
    ├── RecalculateStudentEwsJob.php
    └── GenerateAiAdvisorAnalysisJob.php

resources/js/
├── Pages/
│   ├── GuruKelas/
│   │   ├── Dashboard.tsx
│   │   └── Observations/Create.tsx
│   ├── GuruBK/
│   │   ├── Dashboard.tsx
│   │   └── Cases/Create.tsx
│   └── Kepsek/
│       ├── Dashboard.tsx
│       └── Students/Show.tsx
├── Components/
│   ├── Ews/
│   │   ├── EwsBadge.tsx
│   │   ├── EwsPillarBreakdown.tsx
│   │   └── AiAdvisorCard.tsx
│   └── Modals/
│       └── AiConfirmObservationModal.tsx
└── types/
    └── ews.d.ts
```
