# BK-EWS — Aplikasi Bimbingan Konseling dengan Early Warning System

Aplikasi web Bimbingan Konseling milik PT. Jaya Kartha Solusindo dengan modul AI Early Warning System (EWS) 2-Tier:
**Tier 1** untuk Guru Mata Pelajaran (risiko per mapel) dan **Tier 2** untuk Guru BK (rekap lintas mapel).
Prediksi risiko dihitung oleh model machine learning di folder `EWS_Moodle`, lalu dikirim ke web ini.

Teknologi: Laravel 12 + Inertia + React 19 + Tailwind v4 (web), Python + scikit-learn (model).

## Struktur folder

Kedua repo harus berdampingan dalam satu folder induk, karena web membaca model dari `../EWS_Moodle`:

```
KP/
├── exp_kokar.sql      <- dump database Moodle asli (TIDAK ada di git, minta ke penulis/JKS)
├── EWS_Moodle/        <- model ML, pipeline, sandbox
└── WEB-BK/            <- aplikasi web ini
```

## Data asli: baca dulu

Model dilatih dengan **data Moodle asli sekolah pelanggan JKS**. Data ini berisi identitas siswa, jadi:

- File dump `exp_kokar.sql` dan folder `EWS_Moodle/data_kokar/` **tidak di-commit** (sudah di `.gitignore`).
  Minta file dump langsung ke penulis, jangan dibagikan lewat GitHub, grup chat, atau drive publik.
- Yang tampil di web hanya **data anonim**: nama siswa "Siswa 001", NIS 900xxx, guru "Guru <mapel>",
  dan identitas sekolah "Sekolah Mitra JKS".

## Prasyarat

PHP 8.3+, Composer, Node.js 22+, Python 3 dengan pip.

## Cara menjalankan

**1. Latih model dan siapkan data (di folder `EWS_Moodle`)**

```bash
pip install -r requirements.txt
python train_kokar.py        # membaca ../exp_kokar.sql, sekitar 3 menit
python run_pipeline.py       # membuat data_kokar/output_kokar.json untuk web
```

`train_kokar.py` menghasilkan `ews_kokar_model.pkl` dan data anonim di `data_kokar/`.

**2. Siapkan web (di folder `WEB-BK`)**

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Di `.env`, isi `EWS_API_TOKEN` dengan teks acak apa saja, dan ubah `EWS_PYTHON` ke perintah Python yang
sudah terpasang paketnya (misalnya `python` atau path lengkap `C:/Users/<nama>/anaconda3/python.exe`).

```bash
php artisan migrate:fresh --seed   # membuat database dan mengisi data EWS dari output_kokar.json
php artisan storage:link           # agar logo dan ikon tampil
npm run build
php artisan serve
```

Buka http://localhost:8000.

**3. Akun demo** (kata sandi semua: `password`)

| Email | Peran |
|---|---|
| `admin@gmail.com` | Administrator (sinkronisasi model, kelola mapel) |
| `guru1@gmail.com` | Guru Mata Pelajaran (Tier 1) |
| `bk@gmail.com` | Guru BK (Tier 2) |
| `kepsek@gmail.com` | Kepala Sekolah |

## Sandbox model (opsional)

Untuk mencoba model secara interaktif (geser aktivitas siswa, lihat perubahan risiko), di folder `EWS_Moodle`:

```bash
python sandbox_app.py
```

Buka http://127.0.0.1:5000.

## Memperbarui data

- **Dari web:** login sebagai Admin, tekan **Tarik & Sinkronkan Sekarang**. Laravel menjalankan
  `run_pipeline.py` lalu menyimpan hasilnya. Tindakan guru yang sudah dicatat tidak terhapus.
- **Dump baru dari sekolah:** ganti `exp_kokar.sql`, hapus `EWS_Moodle/data_kokar/`, lalu ulangi langkah 1
  dan tekan tombol sinkronisasi.

## Mengganti identitas sekolah

Atur di `.env`, tanpa mengubah kode:

```
APP_NAME=BK-EWS
SCHOOL_NAME="Sekolah Mitra JKS"
SCHOOL_LOGO=/images/logo-sekolah.svg
```

## Kendala umum

| Gejala | Solusi |
|---|---|
| Seeder: "File keluaran model tidak ditemukan" | Jalankan langkah 1 dulu (`train_kokar.py` lalu `run_pipeline.py`) |
| Sinkronisasi Admin gagal "Pipeline model gagal dijalankan" | Pastikan `EWS_PYTHON` di `.env` menunjuk Python yang sudah `pip install -r requirements.txt` |
| Logo atau ikon tidak tampil | `php artisan storage:link` (hapus dulu folder `public/storage` jika tautannya rusak) |
| `.pkl` gagal dibuka | Versi scikit-learn harus sama dengan `EWS_Moodle/requirements.txt` (1.9.0) |
| Perubahan tidak muncul | `php artisan optimize:clear` lalu `npm run build` |

Panduan alur demo lengkap ada di `EWS_Moodle/PANDUAN_DEMO.md`.
