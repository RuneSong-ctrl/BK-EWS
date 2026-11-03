# DOKUMENTASI LENGKAP PERUBAHAN & TRACKING IMPLEMENTASI EWS
**Proyek**: E-Jurnal STIKMAS — Modul Early Warning System (EWS) Moodle & AI  
**Branch**: `dev/rama`  
**Tanggal Update**: 8 September 2026  
**Status**: 100% Selesai, Terintegrasi, & Terverifikasi (Build Clean)

---

## DAFTAR ISI
1. [Ringkasan Arsitektur 2-Tier & 4 Peran Pengguna](#1-ringkasan-arsitektur-2-tier--4-peran-pengguna)
2. [Penghapusan Observasi Manual Lama](#2-penghapusan-observasi-manual-lama)
3. [Perubahan Database, Migrasi, & Seeder](#3-perubahan-database-migrasi--seeder)
4. [Perubahan Backend & REST API](#4-perubahan-backend--rest-api)
5. [Perubahan Frontend & Antarmuka Multirole](#5-perubahan-frontend--antarmuka-multirole)
6. [Pemetaan 24 Indikator Moodle (5 Domain)](#6-pemetaan-24-indikator-moodle-5-domain)
7. [Daftar Kredensial Akun Pengujian](#7-daftar-kredensial-akun-pengujian)
8. [Petunjuk Pengujian & Verifikasi](#8-petunjuk-pengujian--verifikasi)

---

## 1. Ringkasan Arsitektur 2-Tier & 4 Peran Pengguna

Sistem EWS resmi dimigrasi dari sistem notifikasi tunggal flat menjadi **Arsitektur EWS 2-Tier Berbasis Log LMS Moodle** ("Sebelum ke BK, ke Guru Mapel dahulu"):

```
                         [ Moodle LMS ]
                               |
                   [ Ingestion & Feature Eng ]
                               |
                    [ Model EWS (24 Fitur) ]
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
   [ Tier 1: Per-Mata Pelajaran ]     [ Tier 2: Lintas Mapel ]
   Target: Guru Mapel                 Target: Guru BK
   Aksi: Remedial / Konfirmasi        Aksi: Konseling / Koordinasi Ortu
```

### 4 Peran Terdedikasi:
1. **Administrator (Operator IT / Tim Teknis)**:
   - Mengatur koneksi REST API Moodle (URL & Token Web Service).
   - Menjalankan sinkronisasi on-demand via tombol *"Tarik & Sinkronkan Data Moodle Sekarang"*.
   - Mengelola kamus pemetaan mata pelajaran `course_mapping.csv` (upload CSV baru & inline edit guru, no WA, KKM).
2. **Guru Mata Pelajaran (Tier 1)**:
   - Memantau siswa yang terdeteksi berisiko pada mata pelajaran yang diampu.
   - Mengakses metrik durasi jam belajar kursus, modul lesson interaktif, dan kepatuhan tugas.
   - Memberikan tindakan: *Konfirmasi Tugas*, *Program Remedial*, atau *Tandai Selesai*.
3. **Guru Bimbingan Konseling (Tier 2)**:
   - Triage klinis 3 tingkat (*Prioritas Tinggi $\ge 2$ mapel*, *Inaktif Kritis $> 14$ hari*, *Kendala 1 mapel*).
   - Mendiagnosis profil karakter belajar (*Prokrastinasi Sistemik*, dll.).
   - Melihat matriks komparasi seluruh modul yang diambil siswa.
   - Mencatat sesi bimbingan resmi pada Form Jurnal Konseling BK.
4. **Kepala Sekolah (Master / Eksekutif)**:
   - Memantau radar risiko makro sekolah dan peta risiko rombel kelas (*Class Risk Breakdown*).
   - Memantau *Intervention Coverage Rate* (persentase penanganan oleh guru dan BK).
   - Mencetak laporan pengesahan resmi berformat PDF.

---

## 2. Penghapusan Observasi Manual Lama

Sesuai arahan strategis, seluruh form pencatatan observasi harian manual guru kelas dan slider skala 1-5 **DIHAPUS TOTAL**:
- ❌ Dihapus: Form input catatan perilaku harian guru kelas.
- ❌ Dihapus: Slider linear scale 1-5 dan modal AI structuring teks manual.
- ❌ Dihapus: Form quick attendance manual harian.
- ✅ Digantikan: **Dashboard Monitoring Kursus Moodle (Tier 1)** yang otomatis terisi dari hasil inferensi model Machine Learning.

---

## 3. Perubahan Database, Migrasi, & Seeder

### A. Migrasi Baru: `database/migrations/2026_09_08_000000_create_ews_2tier_and_admin_tables.php`
1. **Tabel `course_mappings`**:
   - `code_module` (string 20, unique)
   - `nama_mapel`, `kategori_mapel`, `nama_guru_mapel`, `no_wa_guru`, `kkm`
2. **Tabel `moodle_sync_logs`**:
   - `triggered_by`, `sync_type` (`manual`/`cron`), `status` (`running`/`success`/`failed`), `students_processed`, `message`, `started_at`, `completed_at`
3. **Tabel `ews_course_alerts` (Tier 1)**:
   - `siswa_id`, `kode_modul`, `nama_mapel`, `kategori_mapel`, `guru_pengampu`, `kkm`
   - `tingkat_risiko` (`TINGGI`/`SEDANG`/`RENDAH`), `probabilitas_risiko`
   - `durasi_belajar_jam`, `lesson_attempts`, `rasio_ketuntasan_lesson`, `nilai_rata_rata_lesson`, `tugas_belum_dikumpul`, `tugas_terlambat`, `nilai_rata_rata_tugas`
   - `metrik_24_fitur_model` (JSON), `faktor_pemicu` (JSON), `rekomendasi_tindakan`
   - `status` (`pending`/`konfirmasi_tugas`/`remedial`/`selesai`), `catatan_guru_mapel`
4. **Tabel `ews_student_summaries` (Tier 2)**:
   - `siswa_id`, `total_mapel_diambil`, `total_mapel_berisiko`, `total_jam_belajar`, `total_tugas_belum_dikumpul`, `total_tugas_terlambat`, `inaktivitas_terlama_hari`
   - `profil_karakter_belajar`, `prioritas_konseling`, `rekomendasi_tindakan`, `rincian_per_mata_pelajaran` (JSON), `status_penanganan`
5. **Tabel `ews_counseling_journals`**:
   - `summary_id`, `guru_bk_id`, `jenis_layanan`, `catatan_konseling`, `rencana_tindak_lanjut`, `evaluasi_perilaku`, `tanggal_monitoring_berikutnya`
6. **Role `admin`**:
   - Ditambahkan pada enum tabel `users`: `['admin', 'guru_kelas', 'guru_bk', 'kepsek']`.

### B. Seeder Baru:
- **`CourseMappingSeeder.php`**: Mengimpor 7 mapel kurikulum aktif dari `course_mapping.csv`.
- **`Ews2TierSeeder.php`**: Mengimpor data inferensi riil dari `sample_output.json` v2.1.0 (6 Tier 1 alerts, 3 Tier 2 summaries, 1 Jurnal Konseling).

---

## 4. Perubahan Backend & REST API

1. **`AdminDashboardController.php`**: Agregasi data integrasi Moodle, KPI kran data, dan tabel pemetaan kursus.
2. **`MoodleSyncController.php`**: Endpoint `syncNow()` on-demand dan `testConnection()` uji koneksi server Moodle.
3. **`CourseMappingController.php`**: Endpoint edit inline, upload file CSV, dan stream unduh CSV.
4. **`EwsApiController.php`**:
   - Ingestion: `POST /api/ews/tier1/alerts` dan `POST /api/ews/tier2/summaries`.
   - Guru Mapel: `GET /api/ews/teacher/my-courses` dan `PATCH /api/ews/teacher/alerts/{id}/status`.
   - Guru BK: `GET /api/ews/bk/triage` dan `POST /api/ews/counseling/record`.
   - Kepsek: `GET /api/ews/kepsek/overview`.
5. **`DashboardController.php`**: Role dispatcher otomatis mengarahkan admin ke `/admin/dashboard`.

---

## 5. Perubahan Frontend & Antarmuka Multirole

1. **`AppLayout.tsx`**: Dukungan peran `admin` dengan badge tema emerald (*Administrator IT*), ikon server, dan link `/admin/dashboard`.
2. **`Admin.tsx` (Dashboard Admin)**:
   - Tombol utama *"Tarik & Sinkronkan Data Moodle Sekarang"* dengan animasi loading & auto-refresh.
   - 4 Bento KPI cards (Status Server Moodle, Waktu Sinkronisasi Terakhir, Kamus Mapel, Siswa Terpantau).
   - Tabel pemetaan modul + Modal Edit Cepat + Modal Unggah CSV.
   - Tabel riwayat audit sinkronisasi log Moodle.
3. **`GuruKelas.tsx` (Dashboard Guru Mapel Tier 1)**:
   - Pill tabs pemilih mata pelajaran yang diampu (`AAA`, `BBB`, `CCC`, dll.).
   - 4 Bento KPI kursus (Siswa Risiko Tinggi, Tugas Bolong, Rata-rata Durasi Jam, Status Penanganan).
   - Tabel alert siswa berisiko + Modal Tindakan (*Konfirmasi Tugas / Remedial / Selesai*).
   - Modal Rincian 24 Indikator Moodle (5 domain).
4. **`GuruBk.tsx` (Dashboard Guru BK Tier 2)**:
   - Triage 3 tingkat (*Prioritas Tinggi $\ge 2$ mapel*, *Inaktif Kritis $> 14$ hari*, *Kendala 1 mapel*).
   - Tabel holistik karakter belajar siswa (*Prokrastinasi Sistemik*, dll.).
   - Modal Matriks Komparasi seluruh mata pelajaran yang diambil siswa.
   - Modal Form Jurnal Konseling resmi (Layanan individu, panggilan ortu, home visit).
5. **`EwsMonitoring.tsx`**: Radar EWS terpadu menampilkan perbandingan Tier 1 dan Tier 2.

---

## 6. Pemetaan 24 Indikator Moodle (5 Domain)

Disimpan utuh di kolom JSON `metrik_24_fitur_model`:
1. **`engagement_dan_durasi`** (9 fitur): `total_clicks`, `active_days`, `days_inactive`, `is_inactive_gt_5d`, `is_inactive_gt_14d`, `clicks_per_active_day`, `clicks_last_14d_ratio`, `unique_sites_accessed`, `course_duration_hours`.
2. **`kepatuhan_tugas`** (4 fitur): `missing_assignments`, `late_submission_count`, `avg_submission_gap`, `procrastination_count`.
3. **`aktivitas_lesson`** (4 fitur): `lesson_attempts_count`, `lesson_time_spent_min`, `lesson_completion_ratio`, `lesson_avg_score`.
4. **`akademik`** (5 fitur): `avg_score`, `min_score`, `score_rel_to_module`, `failing_tasks_count`, `grade_trend`.
5. **`konteks_siswa`** (2 fitur): `num_of_prev_attempts`, `studied_credits`.

---

## 7. Daftar Kredensial Akun Pengujian

Semua akun menggunakan kata sandi: **`password`**

| Peran | Alamat Email | Halaman Dashboard |
| :--- | :--- | :--- |
| **Administrator** | `admin@gmail.com` | `/admin/dashboard` |
| **Guru Mata Pelajaran** | `guru1@gmail.com` | `/guru-kelas/dashboard` |
| **Guru BK** | `bk@gmail.com` | `/guru-bk/dashboard` |
| **Kepala Sekolah** | `kepsek@gmail.com` | `/kepsek/dashboard` |

---

## 8. Petunjuk Pengujian & Verifikasi

```bash
# 1. Jalankan Migrasi & Database Seeder Bersih
php artisan migrate:fresh --seed

# 2. Jalankan Build Frontend React Vite
npm run build

# 3. Jalankan Skrip Verifikasi Database
php tests/test_2tier_system.php
```
