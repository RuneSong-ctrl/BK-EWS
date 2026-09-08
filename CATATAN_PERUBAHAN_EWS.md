# DOKUMENTASI LENGKAP PERUBAHAN & TRACKING IMPLEMENTASI EWS
**Proyek**: E-Jurnal STIKMAS — Modul Early Warning System (EWS) Moodle & AI  
**Branch**: `dev/rama`  
**Tanggal Update**: 8 September 2026  
**Status**: 100% Selesai, Terintegrasi, & Terverifikasi (Build Clean)

---

## DAFTAR ISI
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Riwayat Commit Git](#2-riwayat-commit-git)
3. [Perubahan Database, Migrasi, & Seeder](#3-perubahan-database-migrasi--seeder)
4. [Perubahan Backend & REST API](#4-perubahan-backend--rest-api)
5. [Perubahan Frontend & Antarmuka Multirole](#5-perubahan-frontend--antarmuka-multirole)
6. [Kontrak Data API & Integrasi Engine AI / Worker VPS](#6-kontrak-data-api--integrasi-engine-ai--worker-vps)
7. [Daftar Kredensial Akun Pengujian](#7-daftar-kredensial-akun-pengujian)
8. [Petunjuk Pengujian & Verifikasi](#8-petunjuk-pengujian--verifikasi)

---

## 1. Ringkasan Eksekutif

Modul **Early Warning System (EWS) LMS Moodle & AI Qwen** telah diimplementasikan secara penuh ke dalam ekosistem **E-Jurnal STIKMAS** (berbasis Laravel 12 + Inertia.js + React 19 + Tailwind CSS v4 + SQLite).

Modul ini menjembatani hasil inferensi *machine learning* perilaku belajar daring siswa dari LMS Moodle dengan tindakan nyata di sekolah melalui arsitektur visualisasi berjenjang (*tiered multirole*):
- **Kepala Sekolah (Master Admin / Executive View)**: Pengawasan holistik seluruh rombel sekolah, pemantauan kepatuhan intervensi BK/Wali Kelas, matriks risiko per rombel kelas (*Class Risk Breakdown*), dan lembar pengesahan cetak PDF resmi.
- **Guru BK (Clinical Counselor View)**: Triage klinis kasus urgent (Waspada/Kritis), antrean notifikasi WhatsApp wali murid, dan form 5-tab pencatatan bimbingan konseling.
- **Wali Kelas / Guru Kelas (Homeroom Micro View)**: Pemantauan otomatis terisolasi hanya pada siswa di rombel kelas binaannya (*role-based auto-scoping*), pendampingan belajar santai di kelas, dan rujukan kasus (*referral*) ke Guru BK.

Total berkas terdampak: **26 files** (3.628 penambahan baris kode baru).

---

## 2. Riwayat Commit Git

Semua perubahan tercatat rapi pada branch `dev/rama`:

| Commit Hash | Tipe | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `aa71d30` | `feat` | Implementasi EWS database migrations (`ews_notifications`, `ews_interventions`), Eloquent models, seeder data riil 5 siswa, dan endpoint REST API controller. |
| `66848e3` | `feat` | Implementasi halaman dashboard monitoring EWS (`/ews`), modal detail siswa 5-tab, badge status EWS, serta banner shortcut pada dashboard guru. |
| `9fe7a1c` | `fix` | Perbaikan tabrakan nama prop notifikasi lonceng global (`ewsNotifications`) dan pengamanan fungsi `filter` pada `AppLayout.tsx`. |
| `37554d7` | `feat` | Implementasi visualisasi berjenjang (*Tiered Multirole*) untuk Kepsek, BK, dan Wali Kelas, penghapusan efek *glow/emboss* pada modal (*zero AI slop*), dan banner Kepsek. |
| `8c216c6` | `fix` | Perapian layout action bar tombol atas pada dashboard Guru Kelas, Guru BK, dan Kepsek agar tidak terpotong / *wrapping* ke baris kedua. |
| `0668943` | `merge`| Penggabungan commit `c3ee46c` dari `origin/main` (fitur Cetak Laporan PDF resmi Kepsek, penyempurnaan form LinearScale, akun seeder simpel, dan null-safety data). |
| `e0ae97f` | `test` | Penambahan skrip pengujian otomatis integrasi peran (`test_roles.php`) dan pengujian endpoint REST API (`test_api.php`). |

---

## 3. Perubahan Database, Migrasi, & Seeder

### A. Migration: `database/migrations/2026_09_08_000000_create_ews_notifications_and_interventions_tables.php`
1. **Tabel `ews_notifications`**:
   - `id`: Primary key.
   - `siswa_id`: Foreign key ke `students.id` (cascade delete).
   - `kode_kursus`: Kode mata pelajaran Moodle (contoh: `FIS-10-1`, `KIM-10-1`).
   - `periode`: Semester/periode berjalan (contoh: `2026/2027-Ganjil`).
   - `kategori_risiko`: Enum (`TINGGI`, `SEDANG`, `RENDAH`).
   - `skor_risiko`: Float probabilitas kegagalan (0.00 – 1.00).
   - `skor_persen`: String persen untuk tampilan cepat (contoh: `"78.5%"`).
   - `metrik_perilaku`: Tipe JSON, menyimpan 8 fitur metrik LMS Moodle:
     - `days_inactive`: Jumlah hari tidak login/membuka kursus.
     - `total_clicks`: Total aktivitas klik log belajar siswa.
     - `assignments_submitted`: Jumlah tugas yang berhasil dikumpulkan.
     - `assignments_late`: Jumlah tugas yang dikumpulkan terlambat.
     - `assignments_missed`: Jumlah tugas yang bolong/tidak dikumpulkan.
     - `quizzes_taken`: Jumlah kuis yang dikerjakan.
     - `quiz_avg_score`: Rata-rata nilai kuis online Moodle.
     - `forum_posts`: Jumlah partisipasi diskusi forum LMS.
   - `faktor_pemicu`: Tipe JSON Array, poin temuan anomali (misal: "Inaktif 18 hari berturut-turut", "3 tugas belum dikumpulkan").
   - `narasi_ai`: Text rekomendasi deskriptif dari model SLM Qwen.
   - `audience`: Target pengguna (`guru_bk`, `guru_kelas`, `all`).
   - `guru_target_id`: ID guru tertentu (nullable).
   - `status`: Enum alur proses (`pending`, `generating`, `ready`, `sent`, `failed`).
   - `error_message`: Catatan kendala jika proses gagal (nullable).
   - `sent_at`: Timestamp pengiriman pesan WhatsApp.
   - `timestamps`: `created_at` & `updated_at`.
   - Indexing: `['siswa_id', 'periode']`, `['status']`, `['kategori_risiko']`.

2. **Tabel `ews_interventions`**:
   - `id`: Primary key.
   - `notification_id`: Foreign key ke `ews_notifications.id` (cascade delete).
   - `guru_id`: Foreign key ke `users.id` (pencatat tindakan).
   - `jenis`: Enum tindakan (`KONSELING_INDIVIDU`, `PEMANGGILAN`, `HOME_VISIT`, `KONFIRMASI_WALI`, `SUPERVISI_KEPSEK`, `DISPOSISI_KEPSEK`, `LAINNYA`).
   - `catatan`: Catatan hasil pendampingan / disposisi arahan.
   - `status_siswa`: Evaluasi kondisi pasca-tindakan (`membaik`, `tetap`, `memburuk`).
   - `tanggal_tindak_lanjut`: Tanggal jadwal monitoring berikutnya.
   - `timestamps`: `created_at` & `updated_at`.

### B. Seeder Data:
1. **`database/seeders/EwsNotificationSeeder.php`**:
   - Memuat 5 data riil siswa dari pipeline validasi Fase 1 (Siti Rahmawati, Muhammad Farhan, Ahmad Fauzan, Dewi Lestari, Budi Santoso) dengan 8 metrik perilaku LMS Moodle lengkap, faktor pemicu, narasi SLM Qwen, dan draf pesan WhatsApp.
2. **`database/seeders/BkEwsDatabaseSeeder.php`**:
   - Akun pendidik diperbarui ke format email demo yang praktis:
     - `guru1@gmail.com` (Pak Budi Santoso - Wali Kelas 10-MIPA-1)
     - `guru2@gmail.com` (Bu Siti Aminah - Wali Kelas 10-MIPA-2)
     - `bk@gmail.com` (Bu Rahmawati - Guru BK Sekolah)
     - `kepsek@gmail.com` (Drs. H. Hartono - Kepala Sekolah)
     - Password universal: `password`.

---

## 4. Perubahan Backend & REST API

### A. Eloquent Models
1. **`app/Models/EwsNotification.php`**:
   - Casts: `metrik_perilaku` => `array`, `faktor_pemicu` => `array`, `skor_risiko` => `float`, `sent_at` => `datetime`.
   - Relasi: `belongsTo(Student::class, 'siswa_id')`, `hasMany(EwsIntervention::class, 'notification_id')`, `belongsTo(User::class, 'guru_target_id')`.
2. **`app/Models/EwsIntervention.php`**:
   - Casts: `tanggal_tindak_lanjut` => `date`.
   - Relasi: `belongsTo(EwsNotification::class, 'notification_id')`, `belongsTo(User::class, 'guru_id')`.
3. **`app/Models/Student.php`**:
   - Ditambahkan relasi: `hasMany(EwsNotification::class, 'siswa_id')`.

### B. Controller & Routing
1. **`app/Http/Controllers/EwsMonitoringController.php`**:
   - `index(Request $request)`:
     - **Auto-Scoping Data**:
       - Jika `kepsek`: Menampilkan seluruh data sekolah, menghitung KPI eksekutif (Indeks Risiko, Rasio Penanganan *Coverage %*, Kepatuhan WA), dan menghasilkan agregasi risiko per rombel (`classBreakdown`).
       - Jika `guru_bk`: Menampilkan seluruh data sekolah untuk kebutuhan triage klinis, filter tingkat risiko, dan monitoring antrean WA ortu.
       - Jika `guru_kelas`: Menemukan kelas binaan guru (`SchoolClass::where('homeroom_teacher_id', $user->id)`), lalu membatasi query hanya pada murid di kelas tersebut.
     - Prop Inertia yang dikirimkan dinamai `ewsNotifications` untuk mencegah tabrakan dengan lonceng notifikasi global.
   - `storeIntervention(Request $request)`:
     - Menerima input catatan intervensi/bimbingan dari form modal.
     - Menyimpan ke tabel `ews_interventions` dan memperbarui status notifikasi menjadi `sent` jika sebelumnya berstatus `ready`.
2. **`app/Http/Controllers/Api/EwsApiController.php`**:
   - `POST /api/ews/notifications`: Menerima batch JSON dari worker eksternal VPS / pipeline Python.
   - `PUT /api/ews/notifications/{id}`: Memperbarui status pengiriman pesan WA (`sent`/`failed`).
   - `GET /api/ews/notifications`: Mengambil daftar notifikasi aktif (bisa difilter status & level).
   - `GET /api/ews/notifications/{id}`: Mengambil detail satu notifikasi beserta riwayat intervensi.
   - `POST /api/ews/interventions`: Endpoint API untuk mencatat intervensi secara *programmatic*.
3. **`routes/web.php`**:
   - `GET /ews` $\rightarrow$ `EwsMonitoringController@index` (Middleware: `auth`, role: `guru_bk`, `guru_kelas`, `kepsek`).
   - `POST /ews/interventions` $\rightarrow$ `EwsMonitoringController@storeIntervention`.

---

## 5. Perubahan Frontend & Antarmuka Multirole

### A. Halaman Utama EWS: `resources/js/Pages/Dashboard/EwsMonitoring.tsx`
- **Header Dinamis**: Judul, sub-judul, dan tombol kembali otomatis mengenali peran (`/kepsek/dashboard`, `/guru-bk/dashboard`, atau `/guru-kelas/dashboard`).
- **4 Bento Stat Cards Berjenjang**:
  - Kepsek: Indeks Risiko Sekolah, Kasus Kritis Belum Tertangani, Persentase Penanganan (*Intervention Coverage Rate*), dan Kepatuhan Notifikasi WA.
  - Guru BK: Total Siswa Berisiko Sekolah, Prioritas Kritis Urgent, Kasus Risiko Sedang, Peringatan WA Terkirim.
  - Guru Kelas: Siswa Berisiko di Kelas Binaan, Butuh Pendampingan Segera, Kasus Selesai Didampingi, Notifikasi Orang Tua.
- **Peta Risiko per Rombel Kelas (*Class Risk Breakdown Grid*) Khusus Kepsek**:
  - Menampilkan kartu rombel interaktif (10-MIPA-1, 10-MIPA-2, dst.) lengkap dengan nama wali kelas, jumlah risiko TINGGI/SEDANG/RENDAH, progress penanganan, dan filter 1-klik.
- **Tabel Data Terpadu**:
  - Kolom adaptif per peran (misal: Kepsek melihat nama Wali Kelas pengampu dan status penanganan).
  - Badge urgensi: `KRITIS` (merah lembut), `WASPADA` (oranye lembut), `BERISIKO` (kuning lembut), `NORMAL` (hijau lembut).
  - Tombol aksi kontekstual: Kepsek (*Review & Supervisi*), Guru BK (*Analisis & Intervensi*), Wali Kelas (*Bimbingan / Rujuk*).

### B. Modal Analisis & Tindak Lanjut: `resources/js/components/ews/EwsDetailModal.tsx`
- **Clean Aesthetic (Zero AI Slop)**: Menghapus bayangan ganda/glow neon berlebih, diganti dengan kartu bersih `bg-white border border-slate-200 shadow-2xl rounded-3xl`.
- **Sistem 5 Tab Komprehensif**:
  1. *Rekomendasi AI*: Menampilkan penjelasan SLM Qwen dan saran pendekatan spesifik.
  2. *8 Metrik Perilaku Moodle*: Grid visual pemantauan hari inaktif, total klik, tugas bolong, keterlambatan, nilai kuis, dan posting forum.
  3. *Faktor Pemicu Risiko*: Poin-poin temuan anomali rule-based.
  4. *Draf Pesan WhatsApp*: Teks pesan WA lengkap dengan tombol 1-klik Salin Teks.
  5. *Form Tindak Lanjut & Riwayat*:
     - Menampilkan riwayat intervensi terdahulu (nama konselor, jenis tindakan, catatan, dan tanggal).
     - Form pencatatan intervensi baru yang otomatis menyesuaikan peran:
       - Wali Kelas: Konfirmasi di Kelas, Bimbingan Belajar, Rujuk ke Guru BK.
       - Guru BK: Konseling Individu, Pemanggilan Formal, Home Visit.
       - Kepsek: Arahan Supervisi & Disposisi Penanganan Kasus.

### C. Layout & Integrasi Dashboard Pendidik
1. **`resources/js/Pages/Dashboard/GuruKelas.tsx`**:
   - Menghilangkan tombol duplikat pada bar *Aksi Cepat Wali Kelas*.
   - Mengunci 3 tombol inti (`Input Presensi`, `Input Nilai Akademik`, `Catat Jurnal Siswa`) dengan `whitespace-nowrap` dan `shrink-0` sehingga tidak terpotong ke baris kedua pada resolusi laptop/desktop.
   - Menambahkan banner khusus *Ambient EWS Moodle Radar Quick Banner* dengan tombol CTA kontras: `Buka Radar EWS Kelas Saya`.
2. **`resources/js/Pages/Dashboard/GuruBk.tsx`**:
   - Merapikan action bar dan ambient banner *Peringatan Dini LMS Moodle & WhatsApp Notifier*.
   - Mengganti checkbox emoji menjadi icon Lucide yang elegan.
3. **`resources/js/Pages/Dashboard/Kepsek.tsx`**:
   - Menambahkan *Executive Master Radar EWS Banner* dengan tombol CTA `Buka Radar EWS Eksekutif`.
   - Mengintegrasikan tombol **"Cetak / Unduh PDF"** berdampingan dengan anchor pills tanpa terjadi konflik visual.
4. **`resources/js/Layouts/AppLayout.tsx`**:
   - Menambahkan penjagaan tipe data array `Array.isArray(notifications)` agar lonceng notifikasi global tidak crash saat memproses prop dari rute lain.

---

## 6. Kontrak Data API & Integrasi Engine AI / Worker VPS

Bagi worker Python / Node.js di VPS atau pipeline model machine learning:

### Endpoint Pengiriman Batch Notifikasi:
`POST /api/ews/notifications`  
`Content-Type: application/json`

**Contoh Payload Request:**
```json
{
  "notifications": [
    {
      "siswa_id": 1,
      "kode_kursus": "FIS-10-1",
      "periode": "2026/2027-Ganjil",
      "kategori_risiko": "TINGGI",
      "skor_risiko": 0.88,
      "skor_persen": "88.0%",
      "metrik_perilaku": {
        "days_inactive": 18,
        "total_clicks": 35,
        "assignments_submitted": 1,
        "assignments_late": 2,
        "assignments_missed": 3,
        "quizzes_taken": 1,
        "quiz_avg_score": 45.0,
        "forum_posts": 0
      },
      "faktor_pemicu": [
        "Inaktif di LMS selama 18 hari berturut-turut",
        "3 tugas utama tidak dikumpulkan",
        "Rata-rata kuis di bawah standar (45.0)"
      ],
      "narasi_ai": "Siswa menunjukkan penurunan drastis pada keaktifan e-learning sejak pertengahan semester. Disarankan segera dijadwalkan sesi bimbingan tatap muka.",
      "audience": "guru_bk",
      "status": "ready"
    }
  ]
}
```

### Endpoint Update Status WhatsApp:
`PUT /api/ews/notifications/{id}`  
```json
{
  "status": "sent",
  "sent_at": "2026-09-08 10:30:00"
}
```

---

## 7. Daftar Kredensial Akun Pengujian

Semua akun menggunakan kata sandi: `password`

| Peran Pengguna | Email Akun | Nama Lengkap | Lingkup Data EWS yang Tampil |
| :--- | :--- | :--- | :--- |
| **Kepala Sekolah** | `kepsek@gmail.com` | Drs. H. Hartono, M.Pd. | Seluruh sekolah, Peta Risiko Kelas, Lembar Cetak PDF, Disposisi Arahan |
| **Guru BK (Konselor)**| `bk@gmail.com` | Rahmawati, S.Pd., M.Psi. | Seluruh sekolah, Triage Klinis, Form 5-Tab Konseling, Antrean WA |
| **Wali Kelas 10-MIPA-1**| `guru1@gmail.com` | Budi Santoso, S.Pd. | Terisolasi hanya siswa 10-MIPA-1 (Siti Rahmawati, Ahmad Fauzan, Budi Santoso) |
| **Wali Kelas 10-MIPA-2**| `guru2@gmail.com` | Siti Aminah, S.Pd. | Terisolasi hanya siswa 10-MIPA-2 (Muhammad Farhan, Dewi Lestari) |

---

## 8. Petunjuk Pengujian & Verifikasi

1. **Jalankan Aplikasi Lokal**:
   ```bash
   # Terminal 1: Laravel Backend
   php artisan serve
   
   # Terminal 2: Vite Dev Server
   npm run dev
   ```

2. **Kompilasi Uji Produksi (Clean Build)**:
   ```bash
   npm run build
   # Hasil: ✓ built in 700-800ms tanpa error
   ```

3. **Uji Otomatis Scoping Hak Akses Multirole**:
   ```bash
   php scratch/test_roles.php
   # Hasil: Memverifikasi otomatis isolasi data kelas untuk Wali Kelas dan hak akses master untuk Kepsek/BK.
   ```

4. **Uji Otomatis REST API**:
   ```bash
   php scratch/test_api.php
   # Hasil: Memverifikasi response code 200/201 pada endpoint notifikasi & intervensi.
   ```
