# Design System & UI/UX Specification (DESIGN.md)
# Sistem Informasi Bimbingan Konseling (BK) dengan AI Early Warning System (EWS)

| Atribut Dokumen | Keterangan |
|---|---|
| **Nama Sistem** | Sistem BK-EWS AI (Bimbingan Konseling & Early Warning System) |
| **Tech Stack Acuan** | Laravel 13, Inertia.js (React 19 + TypeScript), Tailwind CSS v4, Lucide Icons |
| **Target Pengguna** | Guru Kelas / Wali Kelas, Guru BK (Konselor), Kepala Sekolah (Kepsek) |
| **Design Language** | Soft Neomorphism + Clean Minimalist SaaS (High Contrast, Eye-Friendly, Non-Alarmist) |
| **Versi Dokumen** | 2.0 (Neomorphic & Complete Screen Specification) |
| **Status Dokumen** | Approved Design Blueprint |

---

## 1. Filosofi Desain & Prinsip Inti

Desain antarmuka BK-EWS AI dirancang secara spesifik untuk lingkungan sekolah menengah dengan memprioritaskan ketenangan visual, kejelasan informasi, dan kenyamanan mata saat digunakan dalam durasi kerja yang panjang oleh tenaga pendidik dan pimpinan sekolah.

### 1.1 Prinsip Fondasi
1. **Soft Neomorphism + Clean Minimalist SaaS:** Menggabungkan estetika neomorphism lembut (dual-shadow extruded cards, sunken inputs) dengan layout tabular SaaS modern yang clean dan ergonomis.
2. **Zero AI-Slop & Distraction-Free:** Tidak menggunakan ornamen dekoratif berlebih, gradient ungu-neon acak, teks placeholder generik, maupun ikonografi kekanak-kanakan. Setiap elemen antarmuka memiliki fungsi operasional yang terukur.
3. **No Emoticons / Emojis:** Seluruh indikator status, aksi, dan navigasi menggunakan vektor linier terstandar (Lucide / Heroicons SVG stroke 1.5px - 1.75px).
4. **Pedagogical Empathy & Anti-Stigma:** Visualisasi status risiko (`NORMAL`, `BERISIKO`, `WASPADA`, `KRITIS`, `DATA_BELUM_LENGKAP`) dirancang dengan nada profesional pendukung intervensi, bukan pelabelan hukuman atau alarmistik yang memicu kepanikan.
5. **Ergonomi Mata Guru & Kepsek (High Eye Comfort):** Menggunakan latar belakang off-white bertingkat lembut (`#F0F3F8` / `#F8FAFC`), rasio kontras teks berbasis standar WCAG AAA, dan kartu putih bersih dengan bayangan difus alami.
6. **Exception-Based Hierarchy:** Memprioritaskan navigasi berbasis anomali. Kepala Sekolah dan Guru BK dapat langsung melihat siswa yang membutuhkan perhatian mendesak tanpa tenggelam dalam ribuan baris data reguler.
7. **Human-in-the-Loop AI Transparency:** Komponen AI (Text Structuring & EWS Advisor) ditampilkan sebagai kartu analitis elegan dengan atribusi jelas, transparansi status data, dan tombol konfirmasi tegas.

---

## 2. Fondasi Visual (Design Tokens & Styles)

### 2.1 Skema Warna (Color Palette)

Palet warna diturunkan secara presisi dari acuan visual SaaS modern berkelas: dominasi warna dasar *Pure Soft-Tinted Canvas*, aksen primer *Royal Indigo-Blue*, serta warna semantik fungsional untuk status EWS 4 tingkat.

```
+-----------------------------------------------------------------------------------+
| BASE & NEUTRAL CANVAS                                                             |
| Background Canvas: #F0F3F8 / #F8FAFC      Card Surface      : #FFFFFF (Pure White)|
| Sidebar Canvas   : #FFFFFF (Border Right) Border Subtle     : rgba(255,255,255,0.8)|
| Border Outline   : #E2E8F0 (Slate 200)    Text Main         : #0F172A (Slate 900) |
| Text Muted       : #475569 (Slate 600)    Text Subtle       : #94A3B8 (Slate 400) |
+-----------------------------------------------------------------------------------+
| BRAND & ACCENT (Royal Indigo-Blue)                                                |
| Primary Solid    : #2563EB (Blue 600)     Primary Hover     : #1D4ED8 (Blue 700)  |
| Primary Surface  : #EFF6FF (Blue 50)      Primary Active    : #DBEAFE (Blue 100)  |
+-----------------------------------------------------------------------------------+
| EWS DETERMINISTIC STATUS TOKENS (Soft-Tinted, Non-Alarmist)                       |
| Normal (Hijau)   : Text #047857 | Bg #ECFDF5 | Border #A7F3D0 | Solid #059669     |
| Berisiko (Kuning): Text #B45309 | Bg #FFFBEB | Border #FDE68A | Solid #D97706     |
| Waspada (Oranye) : Text #C2410C | Bg #FFF7ED | Border #FED7AA | Solid #EA580C     |
| Kritis (Merah)   : Text #BE123C | Bg #FFF1F2 | Border #FECDD3 | Solid #E11D48     |
| Data Kurang (Abu): Text #475569 | Bg #F1F5F9 | Border #CBD5E1 | Solid #64748B     |
+-----------------------------------------------------------------------------------+
```

#### Tailwind CSS v4 Color Tokens Configuration
```css
@theme {
  --color-canvas-bg: #f0f3f8;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  
  --color-brand-primary: #2563eb;
  --color-brand-hover: #1d4ed8;
  --color-brand-light: #eff6ff;
  
  --color-ews-normal-text: #047857;
  --color-ews-normal-bg: #ecfdf5;
  --color-ews-normal-border: #a7f3d0;
  --color-ews-normal-solid: #059669;

  --color-ews-berisiko-text: #b45309;
  --color-ews-berisiko-bg: #fffbeb;
  --color-ews-berisiko-border: #fde68a;
  --color-ews-berisiko-solid: #d97706;

  --color-ews-waspada-text: #c2410c;
  --color-ews-waspada-bg: #fff7ed;
  --color-ews-waspada-border: #fed7aa;
  --color-ews-waspada-solid: #ea580c;

  --color-ews-kritis-text: #be123c;
  --color-ews-kritis-bg: #fff1f2;
  --color-ews-kritis-border: #fecdd3;
  --color-ews-kritis-solid: #e11d48;

  --color-ews-incomplete-text: #475569;
  --color-ews-incomplete-bg: #f1f5f9;
  --color-ews-incomplete-border: #cbd5e1;
  --color-ews-incomplete-solid: #64748b;
}
```

---

### 2.2 Tipografi (Typography Hierarchy)

Sistem tipografi menggunakan font modern sans-serif berkejelasan tinggi (**Plus Jakarta Sans** atau **Inter**).

| Tingkatan Teks | Ukuran Font / Line Height | Font Weight | Kegunaan Utama |
|---|---|---|---|
| **Display / Page Title** | `24px` (`1.5rem`) / `32px` | `700` (Bold) | Judul Halaman Utama (e.g. Dashboard, Monitoring) |
| **Section Heading (H2)** | `18px` (`1.125rem`) / `26px` | `600` (SemiBold) | Header Kartu & Modul Dashboard |
| **Subheading (H3)** | `14px` (`0.875rem`) / `20px` | `600` (SemiBold) | Label Widget, Judul Modal, Sub-bagian EWS |
| **KPI Stat Value** | `28px` (`1.75rem`) / `34px` | `700` (Bold) | Angka Agregat Metrik Utama |
| **Body Default** | `14px` (`0.875rem`) / `22px` | `400` (Regular) | Teks Konten, Paragraf AI, Keterangan Form |
| **Body Medium / Action** | `14px` (`0.875rem`) / `22px` | `500` (Medium) | Teks Tombol, Label Input, Navigasi Aktif |
| **Caption / Meta Data** | `12px` (`0.75rem`) / `16px` | `500` (Medium) | Tanggal, Status Pill, Kategori Kasus, NIP/NISN |
| **Micro Tag** | `11px` (`0.6875rem`) / `14px` | `600` (SemiBold) | Badge Severity, Indikator Tren, Kode Mapel |

---

### 2.3 Spasiasi, Radius & Neomorphic Elevations

- **Grid Spacing Base:** Kelipatan 4px / 8px (`p-2`, `p-3`, `p-4`, `p-6`, `p-8`).
- **Corner Radii:**
  - Kartu Utama & Container: `rounded-2xl` (`16px`).
  - Dropdown, Dialog Modal, Banner AI: `rounded-xl` (`12px`).
  - Button, Input Field, Badge: `rounded-lg` (`8px`) atau `rounded-full` (Pill Avatar/Badges).
- **Elevation Tokens:**
  - **Neomorphic Extrusion (Elevated Cards/Buttons):** `box-shadow: 6px 6px 14px rgba(166, 178, 196, 0.4), -6px -6px 14px rgba(255, 255, 255, 0.9);`
  - **Neomorphic Sunken/Inset (Inputs, Search Bars, Quote Blocks):** `box-shadow: inset 3px 3px 6px rgba(166, 178, 196, 0.3), inset -3px -3px 6px rgba(255, 255, 255, 0.8);`
  - **Neomorphic Button Active/Pressed:** `box-shadow: inset 2px 2px 4px rgba(166, 178, 196, 0.4), inset -2px -2px 4px rgba(255, 255, 255, 0.9);`
  - **Backdrop Overlay:** `bg-slate-900/20 backdrop-blur-sm`

---

## 3. Komponen Desain Terstandarisasi

### 3.1 Global App Shell (Sidebar & Header)

Struktur layout menggunakan sistem *two-column layout*: Sidebar ramping di sisi kiri dan Main Content Area di sisi kanan dengan background `#F0F3F8`.

```
+--------------------------------------------------------------------------------------+
| [Icon] BK-EWS AI (SMA Negeri Terpadu)     [Search: Cari nama/NISN...]  [Date: 14 Aug]|
|                                                                                      |
| +-----------------------------+  +-------------------------------------------------+ |
| | [Avatar] Drs. Made Rama     |  |  DASHBOARD                                      | |
| |          Kepala Sekolah  [v]|  |  Monitoring Kesehatan Akademik & Perilaku       | |
| +-----------------------------+  +-------------------------------------------------+ |
|                                                                                      |
| [Icon] Dashboard (Active Pill)   +----------+  +----------+  +----------+  +-------+ |
| [Icon] Data Siswa & Kelas        | Siswa    |  | Kasus BK |  | Waspada  |  | Hadir | |
| [Icon] Observasi Perilaku (AI)   | 1.248 [>]|  | 14    [>]|  | 3     [>]|  | 97.4% | |
| [Icon] Kasus & Konseling BK      +----------+  +----------+  +----------+  +-------+ |
| [Icon] Rekap Nilai & Kehadiran                                                       |
| [Icon] Pengaturan & Audit Log    +------------------------+  +---------------------+ |
|                                  | Tren Performa Akademik |  | Distribusi Status   | |
|                                  | [ Line Chart ]         |  | [ Donut Chart ]     | |
|                                  +------------------------+  +---------------------+ |
+--------------------------------------------------------------------------------------+
```

#### Spesifikasi User Profile Pill (Sidebar Top)
- **Container:** Elevated soft neomorphic card `p-3 rounded-2xl flex items-center justify-between bg-white/70 border border-white/80`.
- **Avatar:** Ukuran `36x36px`, rounded-full dengan subtle ring `ring-2 ring-white`.
- **User Detail:** Nama (`text-xs font-semibold text-slate-800`), Role Badge (`text-[11px] text-slate-500 font-medium`).
- **Dropdown Chevron:** Icon `ChevronDown` ukuran `14px` warna `text-slate-400`.

#### Item Menu Sidebar
- **Default State:** `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all`
- **Active State:** `bg-blue-50 text-blue-600 font-semibold border border-blue-200/60 shadow-sm`
- **Icon Size:** Ukuran konsisten `18x18px` dengan stroke `1.5px` - `1.75px`.

---

### 3.2 Stat Cards & Metric KPI Widgets

```
+---------------------------------------------------+
| Total Siswa Terdaftar                     [ -> ]  |
|                                                   |
| 1,248                                             |
| +12 siswa semester ini                            |
+---------------------------------------------------+
```

- **Card Wrapper:** Elevated Neomorphic Card `p-5 rounded-2xl bg-[#F0F3F8] border border-white flex flex-col justify-between h-[124px]`.
- **Header Row:** 
  - Title: `text-xs font-semibold uppercase tracking-wider text-slate-500`
  - Action Button: `w-8 h-8 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm hover:shadow-inner transition-all`
- **Value Row:**
  - Big Number: `text-2xl font-bold text-slate-900 tracking-tight`
  - Subtitle Context: `text-xs text-slate-500 font-normal mt-0.5`

---

### 3.3 Status Badge & Indikator 4 Pilar EWS

| Status EWS | Class Tailwind / Styling | Visual Representation |
|---|---|---|
| **NORMAL** | `bg-emerald-50 text-emerald-700 border border-emerald-200/80` | Bulat hijau kecil + Teks "Normal" |
| **BERISIKO** | `bg-amber-50 text-amber-700 border border-amber-200/80` | Bulat kuning kecil + Teks "Berisiko" |
| **WASPADA** | `bg-orange-50 text-orange-700 border border-orange-200/80` | Bulat oranye kecil + Teks "Waspada" |
| **KRITIS** | `bg-rose-50 text-rose-700 border border-rose-200/80` | Bulat merah kecil + Teks "Kritis" |
| **DATA KURANG**| `bg-slate-100 text-slate-600 border border-slate-200` | Bulat abu kecil + Teks "Data Belum Lengkap" |

#### Indikator 4 Pilar Siswa (Pillar Breakdown Bar)
```
[ AK: Normal ] [ KH: Waspada ] [ PR: Normal ] [ BK: Normal ]
```
- Berupa 4 pill mini (`px-2 py-0.5 text-[11px] font-semibold rounded-md`) dengan inisial `AK`, `KH`, `PR`, `BK` berwarna sesuai status pilar masing-masing.

---

## 4. Rincian Desain Antarmuka Halaman (Page Specifications)

### 4.1 Page 1: Dashboard Guru Kelas (Wali Kelas)
**Tujuan:** Manajemen harian kelas, pencatatan observasi perilaku cepat berbantuan AI, dan pemantauan status EWS siswa kelas sendiri.

```
+------------------------------------------------------------------------------------+
| Ringkasan Kelas: 10-MIPA-1 (36 Siswa)                  Tahun Ajaran 2026/2027 Ganjil|
|                                                                                    |
| [ Metrik: 36 Siswa Kelas ] [ Kehadiran: 97.4% ] [ 4 Siswa Perhatian (3 Risk, 1 Wpd)]|
|                                                                                    |
| +--------------------------------------------------------------------------------+ |
| | Input Cepat: Observasi Perilaku Siswa (AI-Powered)                             | |
| | Siswa: [ Pilih Nama Siswa       v]   Tanggal: [ 14/08/2026          ]          | |
| | Catatan Bebas (Sunken Inset Box):                                              | |
| | [ Siswa terlihat pasif 3 hari ini dan menolak bergabung saat kerja kelompok... ]| |
| |                                                                                | |
| | [ [Icon Sparkle] Strukturkan dengan AI ]              [ Input Manual ]         | |
| +--------------------------------------------------------------------------------+ |
|                                                                                    |
| Daftar Siswa Kelas & Status EWS Terkini                                            |
| [Search Siswa...] [Filter Status: Semua v] [Filter Pilar v]                        |
| +--------------------------------------------------------------------------------+ |
| | Nama Siswa        | NIS    | Rata Nilai | Kehadiran | 4 Pilar    | Status EWS| Aksi|
| |-------------------|--------|------------|-----------|------------|-----------|-----|
| | Ahmad Fauzi       | 240101 | 62.5 (Turun)| 82.0%     | [AK][KH].. | [ WASPADA ]|[Dtl]|
| | Annisa Larasati   | 240102 | 88.0 (Naik)| 100%      | [AK][KH].. | [ NORMAL  ]|[Dtl]|
| | Budi Santoso      | 240103 | 71.0 (Stbl)| 91.5%     | [AK][KH].. | [ BERISIKO]|[Dtl]|
| +--------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------+
```

---

### 4.2 Page 2: AI Structuring Confirmation Modal (Human-in-the-Loop Overlay)
**Tujuan:** Dialog modal elevated neomorphic untuk memastikan guru memverifikasi hasil strukturasi AI sebelum disimpan ke basis data.

```
+---------------------------------------------------------------------+
| [Icon Sparkles] Konfirmasi Strukturasi Observasi AI                 |
| Tinjau dan sesuaikan klasifikasi otomatis sebelum disimpan ke basis data |
+---------------------------------------------------------------------+
| Catatan Observasi Guru (Teks Asli):                                 |
| [ Sunken Quote Block: "Siswa terlihat pasif 3 hari ini..."        ] |
|                                                                     |
| Hasil Interpretasi AI (Dapat Diedit):                               |
| +--------------------------------+ +------------------------------+ |
| | Kategori Perilaku              | | Tingkat Keparahan (Severity) | |
| | [ MENARIK_DIRI              v] | | [ SEDANG                  v] | |
| +--------------------------------+ +------------------------------+ |
|                                                                     |
| Ringkasan Formal Terstruktur:                                       |
| [ Inset Input: Menunjukkan isolasi sosial dan keengganan interaksi] |
|                                                                     |
| Saran Tindak Lanjut Awal:                                           |
| [ Inset Input: Mediasi wali kelas dan pantau partisipasi kelompok ] |
+---------------------------------------------------------------------+
| [ Batal / Edit Ulang ]               [ Konfirmasi & Simpan Observasi]|
+---------------------------------------------------------------------+
```

---

### 4.3 Page 3: Dashboard Guru Bimbingan Konseling (Guru BK)
**Tujuan:** Matriks holistik seluruh siswa sekolah, daftar siswa risiko tinggi, dan feed kasus konseling aktif.

```
+------------------------------------------------------------------------------------+
| Konsolidasi Bimbingan Konseling Sekolah               Filter: [ Seluruh Tingkat v ]|
|                                                                                    |
| [ Total Kasus Aktif: 14 ] [ Status Kritis: 2 ] [ Mediasi/Proses: 5 ] [ Selesai: 28]|
|                                                                                    |
| +--------------------------------------+ +---------------------------------------+ |
| | Siswa Prioritas EWS (Watchlist)      | | Feed Kasus BK & Tindak Lanjut Aktif   | |
| |                                      | |                                       | |
| | [!] Dimas Pratama (11-IPS-2)         | | [ Kasus Perundungan (Mediasi Peer)  ] | |
| |     Trigger: Alpa 4 Hari + Nilai <50 | |     3 Siswa Terlibat | Status: PROSES | |
| |     Status: [ WASPADA ]  [ Buka BK ] | |                                       | |
| |                                      | | [ Pelanggaran Tata Tertib Berat     ] | |
| | [!!] Reza Mahendra (10-MIPA-3)       | |     1 Siswa | Status: DIESKALASI      | |
| |     Trigger: Kasus Berat Terdaftar   | |                                       | |
| |     Status: [ KRITIS  ]  [ Buka BK ] | | [ Konseling Personal Mandiri        ] | |
| +--------------------------------------+ +---------------------------------------+ |
|                                                                                    |
| Matriks Holistik Seluruh Siswa                                                     |
| +--------------------------------------------------------------------------------+ |
| | Siswa             | Kelas   | Pilar AK | Pilar KH | Pilar PR | Pilar BK | EWS    | |
| |-------------------|---------|----------|----------|----------|----------|--------| |
| | Dimas Pratama     | 11-IPS-2| [Waspada]| [Waspada]| [Normal ]| [Normal ]| WASPADA| |
| | Reza Mahendra     | 10-MIPA3| [Normal ]| [Normal ]| [Waspada]| [Kritis ]| KRITIS | |
| +--------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------+
```

---

### 4.4 Page 4: Dashboard Eksekutif Kepala Sekolah (Kepsek)
**Tujuan:** Navigasi berbasis anomali (*exception-based navigation*), peringatan dini siswa kritis, tren kesehatan sekolah, dan grafik analitis agregat.

```
+------------------------------------------------------------------------------------+
| Executive Dashboard: Kesehatan Iklim Sekolah & Peringatan Dini                     |
|                                                                                    |
| [ 1.248 Total Siswa ] [ 88% Status Normal ] [ 8% Berisiko ] [ 3% Waspada ] [ 1% Kritis ]
|                                                                                    |
| +--------------------------------------------------------------------------------+ |
| | [Icon Alert] PERINGATAN DINI EKSEKUTIF: 2 SISWA BERSTATUS KRITIS               | |
| | 1. Siswa #SUBJ-1042 (Kelas 10) - Alpa > 5 Hari & Kasus Pelanggaran Berat       | |
| | 2. Siswa #SUBJ-8821 (Kelas 11) - Nilai Turun Drastis & Disengagement           | |
| |                                                                                | |
| | [ Lihat Ringkasan AI Advisor ]             [ Disposisikan ke Tim Guru BK ]     | |
| +--------------------------------------------------------------------------------+ |
|                                                                                    |
| +-------------------------------------+  +---------------------------------------+ |
| | Tren Iklim Kehadiran & Akademik Smt |  | Distribusi Risiko Per Jenjang Kelas   | |
| | [ Smooth Line Bézier Curve Chart ]  |  | [ Semi-Donut Risk Breakdown Chart ]   | |
| +-------------------------------------+  +---------------------------------------+ |
+------------------------------------------------------------------------------------+
```

---

### 4.5 Page 5: Student Holistic Profile & AI Advisor Detail View
**Tujuan:** Lembar profil siswa mendalam, rincian 4 pilar EWS, dan modul AI Advisor dengan tab rekomendasi multi-peran (UU PDP compliant).

```
+------------------------------------------------------------------------------------+
| Siswa: Ahmad Fauzi (NISN: 008921882) - Kelas 10-MIPA-1         Status: [ WASPADA ] |
| Wali Kelas: Dra. Siti Rahmawati, M.Pd                          Update: 14 Agu 2026 |
|                                                                                    |
| +-------------------------+ +-------------------------+                            |
| | 1. Pilar Akademik       | | 2. Pilar Kehadiran      |                            |
| | Rata-rata: 62.5 (Turun) | | Persentase Hadir: 82.0% |                            |
| | Mapel Terendah: MTK (45)| | Alpa Beruntun: 4 Hari   |                            |
| +-------------------------+ +-------------------------+                            |
| +-------------------------+ +-------------------------+                            |
| | 3. Pilar Perilaku       | | 4. Pilar Kasus BK       |                            |
| | 1 Pelanggaran (Sedang)  | | Kasus Aktif: 0          |                            |
| | Catatan: Tidak Fokus    | | Catatan Rahasia Enkripsi|                            |
| +-------------------------+ +-------------------------+                            |
|                                                                                    |
| +--------------------------------------------------------------------------------+ |
| | [Icon Sparkles] AI ADVISOR - REKOMENDASI TERPADU INTERVENSI                    | |
| | Ringkasan Risiko: Siswa menunjukkan penurunan akademik simultan dengan alpa... | |
| | Poin Perhatian Utama:                                                          | |
| | - Ketidakhadiran berurutan 4 hari tanpa surat keterangan.                      | |
| | - Nilai Matematika anjlok ke angka 45.                                         | |
| |                                                                                | |
| | [ Tab 1: Rekomendasi Guru Kelas ] [ Tab 2: Guru BK ] [ Tab 3: Kepala Sekolah ] | |
| | Konten Tab: Lakukan kontak telepon langsung atau kunjungan rumah ke wali murid.| |
| +--------------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------------+
```

---

## 5. Standar Aksesibilitas, Keamanan Data & Interaksi

1. **Micro-interactions:**
   - Button Hover: `transition-all duration-200 ease-out hover:-translate-y-0.5`
   - Active Click: `inset neomorphic shadow shift + scale-[0.99]`
   - Table Row Hover: `hover:bg-white/80 transition-colors`
2. **UU PDP Visual Compliance:** Kolom catatan konseling rahasia yang tidak berhak diakses pengguna menampilkan placeholder visual terenkripsi dengan keterangan kebijakan privasi.
3. **WCAG 2.1 AAA:** Rasio kontras teks utama terhadap background minimal 7:1.
