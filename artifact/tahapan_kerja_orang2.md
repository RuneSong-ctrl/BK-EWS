# Tahapan Kerja Orang 2 — Berbasis Arsitektur EWS 2-Tier Moodle

> **Source of Truth**: [RANCANGAN_SISTEM_EWS_MOODLE.md](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/RANCANGAN_SISTEM_EWS_MOODLE.md)  
> **Keputusan Strategis**: Observasi manual guru dan BK resmi **DIHAPUS**. Seluruh sistem berfokus penuh pada **EWS Otomatis 2-Tier** (Tier 1 Guru Mapel dan Tier 2 Guru BK).

---

## Ringkasan Alur Kerja Pengembang 2

```
Fase 1: Validasi Model 2-Tier Lokal (SELESAI ✅)
   │
   ▼
Fase 2: Setup Database & REST API 2-Tier di Laravel (FOKUS SEKARANG)
   │
   ▼
Fase 3: Antarmuka Web Dashboard Multirole (Guru Mapel, BK, Kepsek)
   │
   ▼
Fase 4: Setup Worker VPS (Pipeline ML ➔ LLM Qwen ➔ Laravel API)
   │
   ▼
Fase 5: Integrasi Notifikasi WhatsApp (Baileys) & Uji Go-Live
```

---

## Fase 1: Validasi Pipeline Model 2-Tier (Lokal) — ✅ SELESAI

**Status**: Selesai dan diverifikasi pada [test_pipeline.py](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/test_pipeline.py).

- [x] Memuat model terkalibrasi (`CalibratedClassifierCV`) 24 fitur dari `ews_moodle_model.pkl`.
- [x] Mengintegrasikan kamus data kurikulum [course_mapping.csv](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/course_mapping.csv).
- [x] Validasi inferensi probabilitas risiko pada sampel siswa multikursus.
- [x] Validasi pembentukan payload **Tier 1 (Guru Mata Pelajaran)**.
- [x] Validasi pembentukan payload **Tier 2 (Guru Bimbingan Konseling)**.
- [x] Menghasilkan kontrak data resmi di [sample_output.json](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/sample_output.json).

---

## Fase 2: Setup Database & API 2-Tier di Laravel (Lokal)

**Tujuan**: Menyiapkan struktur tabel baru yang bersih, menghapus tabel observasi manual lama, dan mengimplementasikan endpoint penerima data 2-Tier.

### 2a. Migration: 3 Tabel Inti EWS 2-Tier

#### 1. Tabel `ews_course_alerts` (Tier 1 — Guru Mata Pelajaran)
Menampung alert per siswa per mata pelajaran:
```php
Schema::create('ews_course_alerts', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('siswa_id');            // Foreign key ke students.id
    $table->string('kode_modul', 20);                  // AAA, BBB, CCC
    $table->string('nama_mapel');                      // Dari course_mapping
    $table->string('kategori_mapel');                  // Kejuruan / Umum
    $table->string('guru_pengampu');                   // Nama guru mapel
    $table->integer('kkm')->default(75);
    $table->enum('tingkat_risiko', ['TINGGI', 'SEDANG', 'RENDAH']);
    $table->float('probabilitas_risiko', 5, 3);        // Contoh: 0.947
    $table->float('durasi_belajar_jam', 6, 1);         // Contoh: 4.5
    $table->integer('lesson_attempts')->default(0);
    $table->float('rasio_ketuntasan_lesson', 4, 2)->default(0.0);
    $table->float('nilai_rata_rata_lesson', 5, 1)->default(0.0);
    $table->integer('tugas_belum_dikumpul')->default(0);
    $table->integer('tugas_terlambat')->default(0);
    $table->float('nilai_rata_rata_tugas', 5, 1)->default(0.0);
    $table->json('faktor_pemicu');                     // List alasan pemicu risiko
    $table->string('rekomendasi_tindakan');
    $table->enum('status', ['pending', 'konfirmasi_tugas', 'remedial', 'selesai'])
          ->default('pending');
    $table->text('catatan_guru_mapel')->nullable();
    $table->timestamps();

    $table->index(['siswa_id', 'kode_modul']);
    $table->index(['tingkat_risiko', 'status']);
});
```

#### 2. Tabel `ews_student_summaries` (Tier 2 — Guru Bimbingan Konseling)
Menampung rekapitulasi holistik karakter belajar per siswa lintas mata pelajaran:
```php
Schema::create('ews_student_summaries', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('siswa_id');            // Foreign key ke students.id
    $table->integer('total_mapel_diambil');
    $table->integer('total_mapel_berisiko');
    $table->float('total_jam_belajar', 6, 1);
    $table->integer('total_tugas_belum_dikumpul');
    $table->integer('inaktivitas_terlama_hari');
    $table->string('profil_karakter_belajar');          // Contoh: "Prokrastinasi Sistemik"
    $table->enum('prioritas_konseling', ['TINGGI', 'SEDANG', 'RENDAH']);
    $table->string('rekomendasi_tindakan');
    $table->json('rincian_per_mata_pelajaran');        // Matriks performa semua mapel
    $table->enum('status_penanganan', ['open', 'in_counseling', 'resolved'])
          ->default('open');
    $table->timestamps();

    $table->index(['siswa_id', 'prioritas_konseling']);
    $table->index('prioritas_konseling');
});
```

#### 3. Tabel `ews_counseling_journals` (Jurnal Tindak Lanjut Konseling BK)
Mencatat sesi bimbingan individual dan komunikasi orang tua:
```php
Schema::create('ews_counseling_journals', function (Blueprint $table) {
    $table->id();
    $table->foreignId('summary_id')
          ->constrained('ews_student_summaries')
          ->cascadeOnDelete();
    $table->unsignedBigInteger('guru_bk_id');          // Konselor yang menangani
    $table->enum('jenis_layanan', ['konseling_individu', 'pemanggilan_siswa', 'home_visit', 'koordinasi_ortu']);
    $table->text('catatan_konseling');                  // Temuan hasil bimbingan
    $table->text('rencana_tindak_lanjut');
    $table->enum('evaluasi_perilaku', ['membaik', 'tetap', 'memburuk'])->nullable();
    $table->date('tanggal_monitoring_berikutnya')->nullable();
    $table->timestamps();
});
```

### 2b. REST API Endpoints

```
// Ingestion dari Worker VPS / Python Pipeline:
POST /api/ews/tier1/alerts        → Simpan batch alert per mata pelajaran
POST /api/ews/tier2/summaries     → Simpan batch rekapitulasi karakter belajar BK

// Konsumsi Frontend Dashboard:
GET  /api/ews/teacher/my-courses  → Data alert khusus guru mapel yang login
GET  /api/ews/bk/triage           → Daftar siswa berisiko terurut prioritas
GET  /api/ews/bk/student/{id}     → Detail riwayat matriks siswa
POST /api/ews/counseling/record   → Simpan jurnal konseling BK
```

### 2c. Seeder Data dari `sample_output.json`
- [ ] Buat `Ews2TierSeeder.php` yang langsung membaca [sample_output.json](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/sample_output.json) sehingga dashboard langsung memiliki data pengujian riil.

---

## Fase 3: Web Dashboard Multirole (React / Inertia)

- [ ] **Antarmuka Guru Mata Pelajaran**:
  - Filter mapel yang diampu guru login.
  - Kartu metrik: Jumlah siswa berisiko, rata-rata durasi belajar kursus.
  - Tabel monitoring siswa: durasi jam, lesson attempts, tugas bolong, dan tombol aksi (*Remedial / Konfirmasi*).
- [ ] **Antarmuka Guru Bimbingan Konseling (BK)**:
  - Triage klinis terurut: Prioritas Tinggi ($\ge 2$ mapel merah), Inaktif Kritis ($> 14$ hari), Kendala Spesifik 1 Mapel.
  - Kartu diagnosis karakter belajar (*Prokrastinasi Sistemik*, dll.).
  - Matriks performa semua mapel per siswa.
  - Form jurnal konseling & jadwal tindak lanjut.
- [ ] **Antarmuka Kepala Sekolah**:
  - Peta risiko kelas (*Class Risk Breakdown*).
  - Indeks risiko sekolah & rasio penanganan (*Intervention Coverage Rate*).
  - Ekspor/Cetak Laporan PDF Resmi.

---

## Fase 4: Setup Worker VPS (Pipeline ML ➔ LLM ➔ API)

- [ ] Script Python di VPS yang mengeksekusi ETL cut-off day 60 Moodle secara berkala (cron mingguan).
- [ ] Eksekusi `test_pipeline.py` versi produksi untuk menghasilkan output Tier 1 dan Tier 2.
- [ ] (Opsional) Generator narasi pesan WhatsApp menggunakan local LLM (Qwen2.5-0.5B via `llama-server`).
- [ ] POST hasil ke endpoint REST API Laravel.

---

## Fase 5: Integrasi WhatsApp (Baileys) & Go-Live

- [ ] Kirim pesan WA notifikasi Tier 1 ke guru pengampu mata pelajaran.
- [ ] Kirim pesan WA pemanggilan Tier 2 dari Guru BK ke orang tua murid (untuk kasus Prioritas Tinggi).
- [ ] Evaluasi sistem end-to-end.
