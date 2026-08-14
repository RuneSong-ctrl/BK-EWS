Act as an elite Senior UI/UX Designer and Lead Design Technologist. Generate a comprehensive, pixel-perfect, high-fidelity design prototype for a web application called **"Sistem BK-EWS AI (Bimbingan Konseling & Early Warning System)"**.

---

### CORE DESIGN PHILOSOPHY & MANDATORY RULES:
1. **Style Paradigm: Soft Neomorphism + Clean Minimalist SaaS**
   - Background canvas: Pure soft-tinted off-white/cool slate (`#F0F3F8` / `#F8FAFC`).
   - Neomorphic Cards & Elements: Crisp dual-shadow extrusion (`box-shadow: 6px 6px 14px rgba(166, 178, 196, 0.4), -6px -6px 14px rgba(255, 255, 255, 0.9)`), subtle borders (`1px solid rgba(255, 255, 255, 0.8)`), rounded corners (`rounded-2xl` 16px).
   - Inset/Sunken elements for text inputs and search bars (`box-shadow: inset 3px 3px 6px rgba(166, 178, 196, 0.3), inset -3px -3px 6px rgba(255, 255, 255, 0.8)`).
   - High legibility, crisp contrast (WCAG AAA compliant), soothing to the eyes for teachers and school principals during long screen sessions.
2. **STRICT Anti-AI Slop & Cleanliness Directives:**
   - NO emojis anywhere in the interface. Use only refined, linear Lucide/Heroicons SVG icons (stroke width: 1.5px to 1.75px).
   - NO chaotic gradient backgrounds or random floating glassmorphism blobs.
   - Clean, professional typography: Modern geometric sans-serif (Plus Jakarta Sans or Inter) with distinct typographic hierarchy.
   - Every single component must have clear functional utility tailored to educational administration.
3. **Color Palette:**
   - Base Surface: `#F0F3F8` / `#FFFFFF`
   - Primary Accent: Royal Indigo-Blue (`#2563EB` solid, `#EFF6FF` subtle pill bg)
   - Secondary Accent: Deep Slate Navy (`#0F172A` headings, `#475569` body text)
   - EWS Status Tokens (Soft-tinted non-alarmist pill badges):
     * NORMAL: Text `#047857`, Background `#ECFDF5`, Border `#A7F3D0`
     * BERISIKO: Text `#B45309`, Background `#FFFBEB`, Border `#FDE68A`
     * WASPADA: Text `#C2410C`, Background `#FFF7ED`, Border `#FED7AA`
     * KRITIS: Text `#BE123C`, Background `#FFF1F2`, Border `#FECDD3`
     * DATA BELUM LENGKAP: Text `#475569`, Background `#F1F5F9`, Border `#CBD5E1`

---

### GLOBAL APP SHELL (PERSISTENT ON ALL SCREENS)
- **Left Sidebar Navigation (Acadex-inspired Clean Layout):**
  - **Top App Branding:** Crisp vector icon + title "BK-EWS AI" (Subtext: "SMA Negeri Terpadu").
  - **User Profile Pill (Top of Sidebar):** Elevated soft neomorphic card containing circular avatar (36x36px), User Full Name ("Mark Averous" / "Drs. I Made Rama, M.Pd"), Role Badge ("Kepala Sekolah" / "Guru BK" / "Guru Kelas"), and dropdown chevron.
  - **Primary Menu Items (Active states marked by blue soft pills):**
    * Dashboard (Active indicator)
    * Data Siswa & Kelas
    * Observasi Perilaku (Input AI)
    * Kasus & Konseling BK
    * Rekap Akademik & Kehadiran
    * Pengaturan & Audit Log
- **Top Header Bar:**
  - Date indicator ("Friday, August 14, 2026"), sunken soft search bar ("Cari nama siswa, NISN, atau kelas..."), and notifications icon button with subtle extrusion.

---

### COMPLETE LIST OF PAGES & SCREENS TO DESIGN (EXACT SCOPE):

#### PAGE 1: Dashboard Guru Kelas (Wali Kelas) - Daily Classroom & Fast AI Input
- **Top Metrics Row (3 Neomorphic Stat Cards with top-right arrow button):**
  1. Total Siswa Kelas: "36 Siswa" (Sub: "10-MIPA-1")
  2. Rata-rata Kehadiran: "97.4%" (Sub: "Bulan ini")
  3. Siswa Perlu Perhatian: "4 Siswa" (Sub: "3 Berisiko, 1 Waspada")
- **Main Action Panel: Fast AI Behavior Observation Input**
  - Form card with student dropdown selector, date picker, and an inset multi-line text area: "Tulis catatan observasi harian siswa secara bebas...".
  - Two action buttons: Primary Neomorphic Blue button "Strukturkan dengan AI" (with sparkle icon) and secondary button "Input Manual".
- **Bottom Section: Class Student Roster & EWS Status Table**
  - Clean table listing students with columns: Nama Siswa, NIS, Rata-rata Nilai (with trend badge), % Kehadiran 30 Hari, 4-Pillar Indicator (AK, KH, PR, BK micro-pills), Overall EWS Status Pill, Action Button "Detail Siswa".

#### PAGE 2: AI Structuring Confirmation Modal (Human-in-the-Loop Overlay)
- Centered elevated neomorphic modal window over subtle backdrop blur.
- Header: "Konfirmasi Strukturasi Observasi AI" + subtext "Tinjau dan sesuaikan klasifikasi otomatis sebelum disimpan ke basis data".
- Left Column: "Teks Catatan Asli Guru" in a sunken quote block.
- Right Column / Form Fields:
  * Dropdown "Kategori Perilaku" (Pre-selected by AI: "MENARIK_DIRI")
  * Dropdown "Tingkat Keparahan / Severity" (Pre-selected: "SEDANG")
  * Text Field "Ringkasan Formal Terstruktur"
  * Text Field "Saran Tindak Lanjut Awal"
- Footer: Secondary button "Batal / Edit Ulang" and Primary Blue button "Konfirmasi & Simpan Observasi".

#### PAGE 3: Dashboard Guru BK (Counselor Portfolio & Case Matrix)
- **Top Metrics Row (4 Elevated Stat Cards):**
  1. Total Kasus Aktif: "14 Kasus"
  2. Status Kritis: "2 Siswa"
  3. Dalam Mediasi / Proses: "5 Kasus"
  4. Kasus Selesai: "28 Kasus"
- **Split View Middle Section:**
  - **Left Card (Priority EWS Watchlist):** List of high-risk students with emergency triggers (e.g., "Dimas Pratama - Alpa 4 Hari Beruntun", "Reza Mahendra - Kasus Berat Terdaftar") with quick action button "Buka Lembar BK".
  - **Right Card (Counseling & Case Feed):** Recent counseling logs, severity badges (RINGAN, SEDANG, BERAT), status tags (BARU_DILAPORKAN, DALAM_PROSES, DIESKALASI_KE_KEPSEK).
- **Bottom Section: Holistic Student Matrix**
  - Filter by Grade Level (X, XI, XII) and EWS Status.
  - Multi-pillar breakdown showing sub-statuses across Academic, Attendance, Behavior, and Counseling.

#### PAGE 4: Dashboard Eksekutif Kepala Sekolah (Kepsek) - Exception-Based Monitoring
- **Top Executive KPIs:**
  - "1,248 Siswa Terdaftar" | "88% Status Normal" | "8% Berisiko" | "3% Waspada" | "1% Kritis"
- **Hero Exception Alert Card (Prominent Elevated Neomorphic Card with Crimson Left Accent):**
  - Title: "Peringatan Dini Eksekutif: 2 Siswa Berstatus Kritis Membutuhkan Penanganan Segera"
  - Student items with pseudonimized metadata: Siswa #SUBJ-1042 (Kelas 10) & Siswa #SUBJ-8821 (Kelas 11).
  - Summary of triggers (Alpa > 5 Hari, Indikasi Disengagement, Kasus Berat).
  - Actions: "Lihat Ringkasan AI Advisor" and "Disposisikan ke Tim Guru BK".
- **Analytical Visualizations Row:**
  - **Left Chart Card (Academic & Attendance Health Trend):** Clean smooth Bézier curve line chart with dashed 75% KKM threshold indicator.
  - **Right Chart Card (Risk Distribution Breakdown):** Semi-donut chart with crisp center total and 4-tier EWS legend.

#### PAGE 5: Student Holistic Profile & AI Advisor Detail View
- **Header Profile Card:** Student Name / Pseudonym, NISN, Class, Homeroom Teacher, and large prominent EWS Status Badge ("WASPADA").
- **4 Pilar Evaluation Cards Grid (2x2 Layout):**
  1. Pilar Akademik (Average Score 62.5, Lowest Subject: Matematika [45], Trend: Turun 2 Periode).
  2. Pilar Kehadiran (Kehadiran 82.0%, Alpa Berturut-turut: 4 Hari).
  3. Pilar Perilaku (1 Pelanggaran Kategori Sedang).
  4. Pilar Kasus BK (Status: 0 Kasus Aktif).
- **AI EWS Advisor Analysis Card (Executive Narrative Box):**
  - Container: Soft blue-tinted neomorphic card with tag "AI ADVISOR - REKOMENDASI TERPADU".
  - Risk Overview narrative text.
  - Primary Concerns (Bullet points).
  - Tabbed Recommendations:
    * Tab 1: Rekomendasi Guru Kelas / Wali Kelas
    * Tab 2: Rekomendasi Guru BK (Konselor)
    * Tab 3: Rekomendasi Kepala Sekolah
  - Footer notice: "Dihasilkan secara otomatis berbasis aturan evaluasi deterministik EWS & UU PDP compliance."

---
Generate all screens with consistent UI scale, soft neomorphic depth, clean typography, precise alignment, and realistic educational data.
