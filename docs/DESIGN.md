# Design System & UI/UX Specification (DESIGN.md)
# E-Jurnal STIKMAS — Sistem Observasi Perilaku & AI Early Warning System (EWS)

| Atribut Dokumen | Keterangan |
|---|---|
| **Nama Sistem** | **E-Jurnal STIKMAS** (Sistem Jurnal Observasi & Early Warning System AI) |
| **Logo Resmi** | `/storage/stikmas.png` (symlink: `public/storage/stikmas.png`) |
| **Tech Stack Acuan** | Laravel 13, Inertia.js (React 19 + TypeScript), Tailwind CSS v4, Lucide Icons, Shadcn UI |
| **Target Pengguna** | Guru Kelas / Wali Kelas, Guru BK (Konselor), Kepala Sekolah (Kepsek) |
| **Design Language** | Soft Clean Tactile + Modern SaaS LMS (High Readability, Non-Alarmist, Zero AI Slop) |
| **Layout Architecture**| Single-Page / Sub-Feature Top Navigation (No Vertical Sidebar) |
| **Versi Dokumen** | 3.0 (Official Gold Standard Design Reference based on Guru Kelas Dashboard) |
| **Status Dokumen** | Approved & Binding Standard |

---

## 1. Filosofi Desain & Prinsip Inti

Desain antarmuka **E-Jurnal STIKMAS** dirancang sebagai modul sub-fitur terpadu yang dapat diintegrasikan langsung ke website utama sekolah. Antarmuka mengutamakan ketenangan visual, kejelasan informasi, dan kenyamanan membaca (*readability*) tinggi di berbagai resolusi layar tanpa kesan artifisial ("AI Slop").

### 1.1 Prinsip Fondasi
1. **Acuan Baku (Gold Standard):** Seluruh halaman dashboard dan formulir sistem wajib merujuk pada standar tata letak dan proporsi yang telah disetujui pada **Halaman Guru Kelas** (`GuruKelas.tsx`).
2. **Zero AI Slop & Tacky Accents:**
   - **Dilarang** menggunakan garis strip warna artifisial di atas kartu (misal: border-top biru/hijau/oranye acak).
   - **Dilarang** menambahkan badge/tag warna-warni dekoratif yang tidak fungsional di bawah angka metrik.
   - **Dilarang** menggunakan animasi pulsing/glow neon yang mengganggu konsentrasi guru.
   - **Dilarang** mempersempit *letter-spacing* secara berlebihan (selalu gunakan `letter-spacing: normal`).
3. **Anti-Stretched Layout (Ergonomic Split):**
   - Tidak membiarkan input, textarea, slider, atau tombol melar 100% horizontal memenuhi layar pada monitor besar.
   - Form observasi & konseling **wajib menggunakan tata letak 2-Kolom Seimbang** (`grid grid-cols-1 lg:grid-cols-12 gap-6`):
     - **Kolom Kiri (`lg:col-span-7`)**: Pemilihan Siswa + Textarea Catatan Naratif Wali Kelas/BK.
     - **Kolom Kanan (`lg:col-span-5`)**: Parameter Evaluasi Skala Linear + Tombol Simpan Observasi.
4. **Single-Page / Sub-Feature Top Navigation (Tanpa Sidebar):**
   - Sistem tidak menggunakan sidebar vertikal kiri.
   - Menggunakan **Header Bar Sticky** yang ringkas di bagian atas dengan logo resmi `/storage/stikmas.png`, kolom pencarian cepat NISN, badge peran penugasan aktif, profil pengguna, dan tombol logout.
5. **Proporsi & Breathing Room Lapang:**
   - Container utama berpusat proporsional dengan batasan `max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8`.
   - Padding atas konten utama dibuat lapang (`pt-8 sm:pt-10 pb-14 sm:pb-20 space-y-8`) sehingga judul halaman tidak menempel rapat pada header bar.
6. **No Emoticons / Emojis:**
   - Seluruh indikator status, tombol, dan navigasi wajib menggunakan vektor linier resmi (`lucide-react`).
7. **Pedagogical Empathy & Anti-Stigma:**
   - Visualisasi status risiko EWS (`NORMAL`, `BERISIKO`, `WASPADA`, `KRITIS`, `DATA_BELUM_LENGKAP`) dirancang dengan nada profesional pendukung intervensi pembinaan, bukan pelabelan hukuman atau alarmistik.
8. **Human-in-the-Loop AI Transparency:**
   - Komponen AI (Strukturasi Observasi & EWS Advisor) berposisi sebagai asisten cerdas yang transparan, selalu membutuhkan konfirmasi/tinjauan guru sebelum disimpan ke database.

---

## 2. Fondasi Visual (Design Tokens & Styles)

### 2.1 Skema Warna (Color Palette)

Palet warna mengadopsi suasana tenang, bersih, dan kontras tinggi:

```
+-----------------------------------------------------------------------------------+
| BASE & CANVAS                                                                     |
| Canvas Background : #EEF2F7 (Soft Slate)      Card Surface   : #EEF2F7 / #FFFFFF  |
| Table Container   : #FFFFFF (Pure White)      Border Subtle  : rgba(255,255,255,0.85)|
| Border Outline    : #E2E8F0 (Slate 200)       Text Main      : #0F172A (Slate 900)|
| Text Muted        : #475569 (Slate 600)       Text Subtle    : #94A3B8 (Slate 400)|
+-----------------------------------------------------------------------------------+
| BRAND ACCENT                                                                      |
| Primary Solid     : #2563EB (Blue 600)        Primary Hover  : #1D4ED8 (Blue 700) |
| Primary Light     : #EFF6FF (Blue 50)         Badge Pill     : #E6EDF5            |
+-----------------------------------------------------------------------------------+
| EWS DETERMINISTIC STATUS TOKENS (Non-Alarmist, Subtle Tint)                       |
| Normal (Hijau)    : Text #047857 | Bg #ECFDF5 | Border #A7F3D0 | Solid #059669    |
| Berisiko (Kuning) : Text #B45309 | Bg #FFFBEB | Border #FDE68A | Solid #D97706    |
| Waspada (Oranye)  : Text #C2410C | Bg #FFF7ED | Border #FED7AA | Solid #EA580C    |
| Kritis (Merah)    : Text #BE123C | Bg #FFF1F2 | Border #FECDD3 | Solid #E11D48    |
| Data Kurang (Abu) : Text #475569 | Bg #F1F5F9 | Border #CBD5E1 | Solid #64748B    |
+-----------------------------------------------------------------------------------+
```

---

### 2.2 Tipografi & Penskalaan Resolusi Layar

Tipografi utama menggunakan **Plus Jakarta Sans** atau **Inter** untuk teks antarmuka, dan **JetBrains Mono** untuk angka metrik, NISN, NIP, serta skor akademik.

| Tingkatan Teks | Ukuran Font / Line Height | Font Weight | Kegunaan Utama |
|---|---|---|---|
| **Page Title (H1)** | `24px - 32px` (`text-2xl sm:text-3xl`) | `800` (ExtraBold) | Judul Halaman Utama |
| **Section Heading (H2)** | `18px - 20px` (`text-lg sm:text-xl`) | `700` (Bold) | Header Kartu & Modul Observasi |
| **Subheading (H3)** | `14px - 16px` (`text-sm sm:text-base`) | `600` (SemiBold) | Label Input, Judul Modal, Sub-bagian EWS |
| **KPI Stat Metric** | `30px - 48px` (`text-3xl sm:text-4xl lg:text-5xl`) | `800` (ExtraBold, Mono) | Angka Statistik Utama |
| **Body Default** | `14px - 16px` (`text-sm sm:text-base`) | `400` / `500` (Medium) | Teks Narasi, Deskripsi Form, Catatan |
| **Caption / Subtext** | `12px - 14px` (`text-xs sm:text-sm`) | `500` (Medium) | Keterangan Stat Card, Tanggal, NIP/NISN |
| **Badge / Micro Pill** | `11px - 12px` (`text-[11px] sm:text-xs`) | `700` (Bold) | Badge Peran, Severity, Status EWS |

#### Penskalaan Responsif Root Font Size (`app.css`)
- Layar Standar Desktop: `html { font-size: 16px; }`
- Layar Resolusi 2K / 1440p ($\ge 1536\text{px}$): `html { font-size: 17px; }`
- Layar Ultrawide / 4K ($\ge 1920\text{px}$): `html { font-size: 18px; }`

---

### 2.3 Standar Komponen Stat Cards (Baku)

Stat cards wajib mengikuti struktur lapang berikut tanpa batasan tinggi sempit:

```tsx
<div className="p-6 sm:p-8 rounded-3xl neo-card flex flex-col justify-between min-h-[155px] space-y-4">
  <div className="flex items-center justify-between">
    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
      Total Siswa Kelas
    </span>
    <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
      <Users className="w-6 h-6" />
    </div>
  </div>
  <div>
    <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-mono">
      {totalCount} Siswa
    </div>
    <p className="text-xs sm:text-sm text-slate-500 mt-1">
      Kelas {className} &bull; TP 2026/2027
    </p>
  </div>
</div>
```

---

### 2.4 Standar Kontrol Skala Linear (`LinearScale.tsx`)

Tombol skala 1-5 dirancang dalam format kontrol tersegmentasi (*compact segmented pill*) yang padat, proporsional, dan mudah diklik:
- Dimensi terkontrol: `max-w-md` (tidak melar memenuhi lebar layar).
- Tinggi tombol: `h-9 sm:h-10 rounded-xl` dengan font `text-xs sm:text-sm font-bold`.
- Active state: Warna semantik jelas dengan kontras tinggi.
- Label rentang: Menampilkan label mini di bawah tombol (`1: Pasif`, `3: Cukup`, `5: Aktif`).

---

### 2.5 Standar Token Neomorphism & Tactile Styling (`app.css`)

Sistem mengadopsi estetika *Soft Clean Neomorphism* dengan fondasi pencahayaan alami (cahaya putih lembut di kiri atas, bayangan abu-abu lembut di kanan bawah):

| Utility Class | Fungsi & Penempatan | Spesifikasi Visual |
|---|---|---|
| `.neo-card` | Kartu kontainer modul & panel utama | `bg-[#EEF2F7]`, border `rgba(255,255,255,0.85)`, box-shadow `5px 5px 12px rgba(166,178,196,0.38), -5px -5px 12px rgba(255,255,255,0.95)` |
| `.neo-inset` / `.neo-sunken` | Input form, textarea, search bar | `bg-[#E7EDF4]`, border `rgba(210,220,233,0.6)`, shadow inset `3px 3px 6px ... -3px -3px 6px` |
| `.neo-btn` | Tombol interaktif sekunder, badge icon | `bg-[#EEF2F7]`, shadow timbul taktil, active state `inset` (efek tertekan ke dalam) |
| `.neo-btn-primary` | Tombol aksi utama (Login, Simpan Data) | Gradient `#2563EB` ke `#1D4ED8`, teks putih tebal, glow shadow biru lembut |
| `.neo-pill` | Segmented control, status pill | Border halus `rgba(255,255,255,0.7)`, shadow mikro timbul |

---

### 2.6 Standar Siluet Gradien Kartu & Anti-Saturasi Bento (Card Silhouette Ambient Standard)

Untuk menghindari kesan artifisial ("AI Slop") dan kejenuhan warna (*color fatigue*), kartu metrik dan Bento Grid **wajib mematuhi standar siluet ambien berikut**:

1. **Warna Dasar Kartu Tetap Bersih (`#EEF2F7` / Neomorfik):**
   - Bodi kartu tidak boleh diwarnai solid atau menggunakan gradien warna mencolok yang memenuhi seluruh permukaan kartu.
   - Permukaan kartu wajib mempertahankan warna dasar abu-abu slate `#EEF2F7` dengan border putih halus `border-white/80` dan bayangan difus alami.
2. **Prinsip Siluet Halus (Ambient Whisper &lt; 8% Opacity):**
   - Warna aksen (biru, hijau, amber, oranye, merah) **HANYA boleh hadir sebagai siluet/pantulan cahaya lembut** di tepi kartu.
   - Menggunakan `radial-gradient` dengan opasitas sangat tipis ($\le 0.08$ atau $8\%$) dan radius ketat ($\le 48\%$) yang memudar ke warna dasar `#EEF2F7`.
3. **Variasi Arah Siluet (Directional Rhythm antar-Kartu):**
   - Titik pusat gradien dinaikkan mendekati tepi luar dan arah datangnya cahaya **wajib bervariasi** di setiap kartu agar tidak seragam atau monoton:
     - **Kartu Hero / Populasi (Biru)**: Pojok Kanan Atas dinaikkan ke luar perimeter (`circle at 92% -8%`, radius `48%`, `rgba(59, 130, 246, 0.08)`).
     - **Kartu Status Normal (Hijau)**: Kanan Tengah di belakang radial gauge SVG (`circle at 88% 45%`, radius `45%`, `rgba(16, 185, 129, 0.08)`).
     - **Kartu Status Berisiko (Kuning Amber)**: Pojok Kanan Atas di belakang tombol icon (`circle at 92% -12%`, radius `45%`, `rgba(245, 158, 11, 0.08)`).
     - **Kartu Status Waspada (Oranye)**: Pojok Kiri Atas (`circle at 12% -12%`, radius `45%`, `rgba(249, 115, 22, 0.08)`).
     - **Kartu Status Kritis (Merah Rose)**: Pojok Kanan Bawah (`circle at 90% 105%`, radius `48%`, `rgba(244, 63, 94, 0.08)`).

---

### 2.7 Standar Penempatan Shortcut Akses Cepat (Top Quick Action Bar)

1. **Posisi Paling Atas (Top-First Hierarchy):**
   - Tombol shortcut jurnalisasi cepat / entri observasi kilat **wajib diletakkan di posisi paling atas halaman** (tepat di bawah judul halaman), sehingga pendidik yang baru masuk langsung dapat melihat dan mengklik tanpa harus menggulir ke bawah atau terhimpit di bawah modul lain.
2. **Estetika Harmonis (Non-Slop Tone):**
   - Latar belakang bar shortcut menggunakan kartu putih lembut atau gradien biru/slate tipis dengan border halus `border-blue-200/60`.
   - **Dilarang keras** menggunakan warna blok ungu pekat, gradien neon jenuh, atau warna kontras artifisial yang merusak kesatuan tema aplikasi.

---

## 3. Struktur Layout & Navigasi Aplikasi (`AppLayout.tsx`)

### 3.1 Top Header Bar
```
+------------------------------------------------------------------------------------------------+
| [Logo] E-Jurnal STIKMAS [AI]   [Search: Cari siswa, NISN, atau kelas...]   [Wali Kelas] [Bell] [User] [Logout] |
+------------------------------------------------------------------------------------------------+
```
- **Kiri:** Logo resmi `/storage/stikmas.png` + Nama **E-Jurnal STIKMAS** + Badge AI.
- **Tengah:** Kolom pencarian cepat NISN/Siswa (`h-10 rounded-xl neo-inset bg-[#EEF2F7]`).
- **Kanan:** Badge Peran Aktif (`Wali Kelas` / `Guru BK` / `Kepsek`), Lonceng Notifikasi EWS, User Info, dan Tombol Logout.

---

## 4. Standar Implementasi Halaman Dashboard

### 4.1 Dashboard Guru Kelas (`GuruKelas.tsx`)
- **Header**: Judul `Ringkasan Evaluasi & Jurnal Kelas [Nama Kelas]` + Subtitle fungsional.
- **KPI Stat Cards (3 Kolom)**: `Total Siswa Kelas`, `Rata-rata Presensi`, `Perlu Atensi (EWS)`.
- **Panel Observasi Harian (2-Kolom Seimbang)**:
  - Sisi Kiri (`7 Kolom`): Autocomplete Siswa + Textarea Naratif Wali Kelas (dengan tombol AI di kanan bawah).
  - Sisi Kanan (`5 Kolom`): Parameter Skala Linear (Partisipasi, Tugas, Kuis) + Tombol Simpan Observasi.
- **Matriks Siswa & Evaluasi 4 Pilar EWS**:
  - Filter pencarian nama/NISN dan dropdown status EWS.
  - Tabel rekapitulasi nilai, kehadiran, pill mini 4 pilar EWS, status deterministik, dan tautan detail Profil 360°.

### 4.2 Dashboard Guru BK (`GuruBk.tsx`)
- **KPI Stat Cards (4 Kolom)**: `Kasus Aktif`, `Status Kritis`, `Dalam Mediasi`, `Kasus Selesai`.
- **Panel Konseling & Penanganan Kasus (2-Kolom Seimbang)**:
  - Sisi Kiri (`7 Kolom`): Autocomplete Siswa Lintas Seluruh Kelas + Pilihan Layanan Konseling + Catatan Sesi Verbatim.
  - Sisi Kanan (`5 Kolom`): Evaluasi BK (Urgensi, Rapport, Resolusi) + Checkbox Tindak Lanjut/Eskalasi + Tombol Simpan.
- **Watchlist Kasus & Matriks Lintas Jenjang**:
  - Daftar siswa prioritas atensi EWS dan riwayat sesi konseling aktif.

### 4.3 Dashboard Kepala Sekolah (`Kepsek.tsx`)
- **Executive Metric Cards (5 Kolom)**: `Total Siswa`, `Status Normal`, `Status Berisiko`, `Status Waspada`, `Status Kritis`.
- **Panel Siswa Perlu Atensi & Analisis Iklim Sekolah**.

---

## 5. Standar Eksekusi Kode & Kepatuhan UI

1. **Selalu Gunakan Komponen Desain Terstandarisasi:** Gunakan Shadcn UI primitives (`resources/js/components/ui/`) dan helper `cn()` dari `@/lib/utils`.
2. **Kepatuhan Privasi (UU PDP No. 27/2022):** Catatan konseling rahasia dan data sensitif hanya dapat diakses oleh peran yang memiliki otorisasi.
3. **Pemberitahuan Interaksi (Feedback):** Selalu berikan respon visual melalui `toast` dari `@/hooks/use-toast` saat data berhasil disimpan atau gagal.
4. **Verifikasi Build:** Setiap perubahan antarmuka wajib divalidasi dengan `npm run build` untuk memastikan tidak ada kesalahan TypeScript atau JSX.

---

## 6. Standar Desain Halaman Autentikasi (Login & Registrasi)

Halaman autentikasi (`AuthLayout.tsx`, `Login.tsx`, `Register.tsx`) menggunakan arsitektur kartu terpadu (*Unified Single-Card Architecture*) yang memusatkan seluruh identitas sistem dan interaksi form ke dalam satu wadah neomorfik yang harmonis.

### 6.1 Arsitektur Tata Letak Kartu Terpadu (Unified Single Card)

```
+-------------------------------------------------------------------------------+
| Canvas Background: #EEF2F7 with Soft Ambient Radial Glows                     |
|                                                                               |
|            +-----------------------------------------------------+            |
|            |                 [ UNIFIED NEO-CARD ]                |            |
|            |                                                     |            |
|            |                  [ Logo STIKMAS ]                   |            |
|            |               E-Jurnal STIKMAS [ AI ]               |            |
|            |       Sistem Observasi & Early Warning System       |            |
|            |       ---------------------------------------       |            |
|            |                                                     |            |
|            |                 Portal Masuk Sistem                 |            |
|            |          Masuk untuk akses jurnal pendidik          |            |
|            |                                                     |            |
|            |   [NIP atau Email Resmi]                            |            |
|            |   [ (Mail) 19850115... atau guru@sekolah.sch.id   ] |            |
|            |                                                     |            |
|            |   [Kata Sandi]                     [Enkripsi Aktif] |            |
|            |   [ (Lock) ••••••••                  (Eye Toggle) ] |            |
|            |                                                     |            |
|            |   [x] Ingat saya di perangkat ini                   |            |
|            |                                                     |            |
|            |   [========== MASUK KE SISTEM -> ==========]        |            |
|            |                                                     |            |
|            |     Belum memiliki akun? Daftar Akun Pendidik       |            |
|            +-----------------------------------------------------+            |
|                                                                               |
|        Kepatuhan Privasi Data Siswa • Dilindungi UU PDP No. 27 Tahun 2022     |
+-------------------------------------------------------------------------------+
```

### 6.2 Prinsip Baku Desain Autentikasi
1. **Satu Kartu Terpadu (Single Unified Container):**
   - **Dilarang** memisahkan logo/nama website di luar kartu menjadi floating top bar terpisah.
   - Logo resmi `/storage/stikmas.png`, nama website **E-Jurnal STIKMAS**, badge versi **AI EWS**, sub-judul, dan form input **wajib berada di dalam satu container kartu yang sama** (`neo-card`).
2. **Proporsi & Dimensi:**
   - Kartu login berpusat di tengah layar secara vertikal & horizontal.
   - Lebar kartu: `max-w-md` (untuk Login) dan `max-w-lg` (untuk Registrasi Multi-Role).
   - Padding dalam kartu: `p-7 sm:p-9 rounded-3xl`.
3. **Penerapan Neomorfisme Autentikasi:**
   - Background Kanvas: `#EEF2F7`.
   - Card Surface: `neo-card bg-[#EEF2F7] border border-white/80`.
   - Input Fields: `neo-inset bg-[#E7EDF4] rounded-xl h-11 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none`.
   - Action Button: `neo-btn-primary font-bold text-xs sm:text-sm rounded-xl h-11 sm:h-12`.
   - Secondary Interactive Elements: `neo-btn` dengan active pressed feedback.
4. **Ergonomi Input & Keamanan:**
   - Input NIP/Email mendukung format NIP 18-digit (`font-mono`) maupun alamat email resmi sekolah.
   - Input Kata Sandi dilengkapi indikator enkripsi dan fitur toggle visibilitas sandi (*show/hide password*).
   - Validasi error ditampilkan tepat di bawah field bersangkutan dengan ikon `AlertCircle` dan warna `text-rose-600 font-semibold text-[11px]`.
5. **Kepatuhan Regulasi & Privasi:**
   - Menampilkan catatan kepatuhan privasi (UU PDP No. 27/2022) di bagian bawah luar kartu dengan nada profesional dan tenang.
