# Workflow Lengkap EWS 2-Tier — Dari Moodle LMS Sampai Tindak Lanjut Sekolah

> **Source of Truth**: [RANCANGAN_SISTEM_EWS_MOODLE.md](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/RANCANGAN_SISTEM_EWS_MOODLE.md)  
> **Prinsip Utama**: Menghapus total observasi manual tradisional, fokus 100% pada deteksi otomatis berbasis log aktivitas LMS Moodle, dan menerapkan arsitektur berjenjang (*tiered*): *"Sebelum ke BK, ke Guru Mata Pelajaran dahulu"*.

---

## 1. Arsitektur Alur Sistem 2-Tier

```
                            +----------------------------------------+
                            |           LMS Moodle Sekolah           |
                            | (mdl_logstore, mdl_assign, mdl_lesson) |
                            +----------------------------------------+
                                                 |
                                                 v
                            +----------------------------------------+
                            |      ETL Ingestion & 24 Fitur          |
                            | (Cut-off Day 60, Lesson, Durasi, Nilai)|
                            +----------------------------------------+
                                                 |
                                                 v
                            +----------------------------------------+
                            |     Model EWS Terkalibrasi (Random     |
                            |   Forest + CalibratedClassifierCV)     |
                            |   Threshold: 0.40 | course_mapping.csv |
                            +----------------------------------------+
                                                 |
                        +------------------------+------------------------+
                        |                                                 |
                        v                                                 v
     +------------------------------------+             +------------------------------------+
     |    TIER 1: Guru Mata Pelajaran     |             |         TIER 2: Guru BK            |
     |        (Per-Mata Pelajaran)        |             |     (Rekapitulasi Lintas Mapel)    |
     +------------------------------------+             +------------------------------------+
     | • Evaluasi 1 mapel spesifik        |             | • Diagnostik karakter belajar      |
     | • Tugas bolong, telat, lesson, jam |             | • Lintas semua mapel yang diambil  |
     | • Output: JSON Guru Mapel          |             | • Output: JSON Guru BK             |
     | • Aksi: Remedial / Bimbingan Kelas |             | • Aksi: Konseling / Panggilan Ortu |
     +------------------------------------+             +------------------------------------+
                        |                                                 ^
                        | (Eskalasi: Jika $\ge 2$ mapel bermasalah)       |
                        +-------------------------------------------------+
```

---

## 2. Mengapa Observasi Manual Dihapus?

Pada sistem lama, deteksi kendala siswa bertumpu pada observasi manual guru di kelas dan formulir catatan BK. Pendekatan ini memiliki kelemahan mendasar:
1. **Subjektif & Terlambat**: Guru baru menyadari masalah saat siswa sudah gagal ujian akhir atau akumulasi alpa parah.
2. **Beban Administrasi Tinggi**: Guru disibukkan mengisi catatan manual di tengah kesibukan mengajar.
3. **Stigma Negatif BK**: Siswa merasa dihakimi saat dipanggil ke ruang BK karena tidak didasari bukti data objektif.

**Dengan EWS 2-Tier Otomatis**:
- **Objektif & Berbasis Data**: Menggunakan 24 indikator aktivitas digital di Moodle (klik, durasi, kepatuhan kuis/lesson, dan tren nilai).
- **Proaktif (Hari ke-60)**: Masalah terdeteksi di awal semester (minggu ke-8/cut-off day 60), jauh sebelum ujian akhir semester tiba.
- **Berjenjang (Tier 1 ➔ Tier 2)**: Guru mapel menyelesaikan masalah teknis tugas/materi terlebih dahulu. Hanya siswa dengan masalah sistemik yang dieskalasi ke Guru BK.

---

## 3. Rincian 2-Tier Pembagian Peran

### Tier 1: Level Mata Pelajaran (Guru Mata Pelajaran / Wali Kelas)
* **Lingkup**: Spesifik pada satu mata pelajaran (`code_module` seperti `AAA`, `BBB`, `CCC`).
* **Kamus Data**: Dihubungkan dengan kurikulum riil melalui [course_mapping.csv](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/course_mapping.csv) (Nama Mapel, KKM, Guru Pengampu, No. WA Guru).
* **Indikator Kunci**:
  - `course_duration_hours`: Akumulasi durasi waktu siswa mengakses materi kursus.
  - `lesson_attempts_count` & `lesson_completion_ratio`: Partisipasi pada modul interaktif *Lesson*.
  - `missing_assignments` & `late_submission_count`: Kepatuhan pengumpulan tugas.
  - `avg_score` terhadap KKM mapel.
* **Tindakan Guru Mapel**:
  - Konfirmasi tugas tertinggal saat jam pelajaran di kelas.
  - Penjadwalan remedial materi pelajaran yang belum tuntas.

### Tier 2: Level Holistik & Karakter Belajar (Guru Bimbingan Konseling)
* **Lingkup**: Rekapitulasi profil belajar siswa lintas seluruh mata pelajaran yang diambil pada semester aktif.
* **Diagnosis Karakter Belajar Otomatis**:
  1. **Prokrastinasi Sistemik**: Siswa terdeteksi merah/kuning pada $\ge 2$ mata pelajaran dengan pola banyak tugas bolong dan terlambat.
  2. **Inaktivitas Menyeluruh**: Siswa inaktif dari seluruh kursus LMS $> 14$ hari (indikasi kendala psikososial, keluarga, atau absensi).
  3. **Kesulitan Spesifik Mata Pelajaran**: Siswa hanya bermasalah pada 1 mata pelajaran tertentu (misal: hanya di mapel Produktif RPL), sementara mapel umum aman.
* **Tindakan Guru BK**:
  - *Prioritas Tinggi* ($\ge 2$ mapel merah): Pemanggilan konseling individual, koordinasi wali kelas, dan komunikasi ke orang tua.
  - *Prioritas Sedang* (1 mapel merah): Koordinasi dengan guru mapel pengampu tanpa pemanggilan formal langsung.
  - *Prioritas Rendah* (0 mapel berisiko): Pemantauan berkala.

---

## 4. Spesifikasi Kontrak Data API JSON

File [sample_output.json](file:///c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/sample_output.json) menjadi kontrak data resmi antara engine AI dengan Dashboard Web:

### A. Payload Tier 1: Guru Mata Pelajaran
```json
{
  "target_audience": "GURU_MATA_PELAJARAN",
  "id_siswa": 28400,
  "nama_siswa": "Ahmad Fauzan",
  "kelas": "X-RPL-1",
  "mata_pelajaran": {
    "kode_modul": "AAA",
    "nama_mapel": "Pemrograman Web dan Perangkat Bergerak",
    "kategori": "Kejuruan/Produktif",
    "guru_pengampu": "I Wayan Sudarma S.Kom.",
    "kkm": 75
  },
  "analisis_risiko": {
    "tingkat_risiko": "TINGGI",
    "probabilitas_risiko": 0.947,
    "threshold": 0.4
  },
  "metrik_kinerja": {
    "durasi_belajar_jam": 4.5,
    "lesson_attempts": 0,
    "rasio_ketuntasan_lesson": 0.0,
    "nilai_rata_rata_lesson": 0.0,
    "tugas_belum_dikumpul": 2,
    "tugas_terlambat": 1,
    "nilai_rata_rata_tugas": 38.0
  },
  "faktor_pemicu": [
    "2 tugas belum dikumpulkan.",
    "Belum mengakses aktivitas Lesson interaktif.",
    "Akumulasi waktu belajar rendah (4.5 jam).",
    "Inaktif di kursus selama 16 hari."
  ],
  "rekomendasi_tindakan": "Perlu perhatian langsung dan konfirmasi tugas di kelas."
}
```

### B. Payload Tier 2: Guru Bimbingan Konseling (BK)
```json
{
  "target_audience": "GURU_BK",
  "id_siswa": 28400,
  "nama_siswa": "Ahmad Fauzan",
  "kelas": "X-RPL-1",
  "rekapitulasi_semester": {
    "total_mapel_diambil": 2,
    "total_mapel_berisiko": 2,
    "total_jam_belajar": 8.2,
    "total_tugas_belum_dikumpul": 4,
    "inaktivitas_terlama_hari": 16
  },
  "profil_karakter_belajar": "Prokrastinasi Sistemik (Keterlambatan dan kelalaian tugas di banyak mapel).",
  "prioritas_konseling": "TINGGI",
  "rekomendasi_tindakan": "Jadwalkan konseling individual dan koordinasi dengan wali kelas.",
  "rincian_per_mata_pelajaran": [
    {
      "kode_modul": "AAA",
      "nama_mapel": "Pemrograman Web dan Perangkat Bergerak",
      "kategori": "Kejuruan/Produktif",
      "guru_pengampu": "I Wayan Sudarma S.Kom.",
      "probabilitas": 0.947,
      "status_risiko": "MERAH",
      "tugas_belum_dikumpul": 2,
      "durasi_belajar_jam": 4.5
    },
    {
      "kode_modul": "BBB",
      "nama_mapel": "Basis Data",
      "kategori": "Kejuruan/Produktif",
      "guru_pengampu": "Ni Made Rai Astuti S.Pd.",
      "probabilitas": 0.946,
      "status_risiko": "MERAH",
      "tugas_belum_dikumpul": 2,
      "durasi_belajar_jam": 3.7
    }
  ]
}
```

---

## 5. Ringkasan Integrasi ke Dashboard Web

1. **Dashboard Guru Mapel**:
   - Menampilkan alert Tier 1 sesuai kelas dan mapel yang diampu guru.
   - Form tindak lanjut: Remedial / Konfirmasi Tugas.
2. **Dashboard Guru BK**:
   - Menampilkan ringkasan Tier 2: Triage prioritas siswa (Tinggi/Sedang/Rendah).
   - Jurnal konseling: Catatan pemanggilan, hasil bimbingan, evaluasi perubahan siswa.
3. **Dashboard Kepala Sekolah**:
   - Executive monitoring: Indeks risiko sekolah dan kepatuhan penyelesaian tindak lanjut guru.
