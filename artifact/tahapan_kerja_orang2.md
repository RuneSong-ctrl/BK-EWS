# Tahapan Kerja Orang 2 — Step by Step

## Jangan Mulai dari VPS

Setup VPS itu langkah **tengah**, bukan awal. Kalau kamu langsung setup llama-server dan Baileys tapi belum tahu apakah pipeline model → JSON → prompt berjalan benar, kamu bakal bolak-balik debug di environment yang jauh lebih susah (SSH, limited resource, no IDE).

**Urutan yang benar:**

```
Lokal dulu → Laravel dulu → VPS terakhir
```

---

## Fase 1: Validasi Pipeline Model (Lokal, Hari Ini)

**Tujuan:** Pastikan `.pkl` bisa di-load, inferensi jalan, JSON keluar benar, prompt LLM terbentuk.

**Yang dikerjakan:** Buat 1 file Python di repo `Model-BK-Ews`:

- [ ] Buat file `test_pipeline.py`
- [ ] Load `ews_moodle_model.pkl` dengan `joblib`
- [ ] Siapkan sample data 3-5 siswa (hardcode atau ambil dari CSV)
- [ ] Jalankan `model.predict_proba()` → pastikan output probabilitas masuk akal
- [ ] Jalankan `generate_ews_json()` → pastikan JSON terbentuk dengan benar
- [ ] Jalankan `create_slm_prompt()` → pastikan prompt terbentuk
- [ ] Jalankan `generate_wa_notification()` → pastikan template statis terbentuk
- [ ] Simpan output JSON ke file `sample_output.json` sebagai referensi kontrak data

**Deliverable:** File `sample_output.json` yang berisi contoh payload risiko siswa — ini jadi **kontrak data** antara model dan notifier.

**Waktu:** ~1-2 jam

---

## Fase 2: Setup Database & API di Laravel (Lokal)

**Tujuan:** Siapkan fondasi di dashboard BK-EWS untuk menerima dan menampilkan data EWS.

### 2a. Migration: Tabel Notifikasi

- [ ] Buat migration Laravel untuk tabel `ews_notifications`:

```php
Schema::create('ews_notifications', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('siswa_id');       // ID siswa di sistem
    $table->string('kode_kursus');                 // code_module
    $table->string('periode');                     // code_presentation / semester
    $table->enum('kategori_risiko', ['TINGGI', 'SEDANG', 'RENDAH']);
    $table->float('skor_risiko');                  // 0.0 - 1.0
    $table->string('skor_persen');                 // "71.9%"
    $table->json('metrik_perilaku');               // 8 fitur Moodle
    $table->json('faktor_pemicu');                 // array string alasan
    $table->text('narasi_ai')->nullable();         // hasil generate LLM
    $table->string('audience')->default('guru_bk');
    $table->unsignedBigInteger('guru_target_id')->nullable();
    $table->enum('status', ['pending', 'generating', 'ready', 'sent', 'failed'])
          ->default('pending');
    $table->text('error_message')->nullable();
    $table->timestamp('sent_at')->nullable();
    $table->timestamps();

    $table->index(['siswa_id', 'periode']);
    $table->index(['status']);
    $table->index(['kategori_risiko']);
});
```

### 2b. Migration: Tabel Tindak Lanjut Konseling

- [ ] Buat migration untuk tabel `ews_interventions`:

```php
Schema::create('ews_interventions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('notification_id')
          ->constrained('ews_notifications')
          ->cascadeOnDelete();
    $table->unsignedBigInteger('guru_id');         // Guru yang menangani
    $table->enum('jenis', ['konseling', 'pemanggilan', 'home_visit', 'lainnya']);
    $table->text('catatan');                        // Hasil sesi
    $table->enum('status_siswa', ['membaik', 'tetap', 'memburuk'])->nullable();
    $table->date('tanggal_tindak_lanjut')->nullable(); // Jadwal follow-up
    $table->timestamps();
});
```

### 2c. API Endpoint

- [ ] Buat endpoint untuk **menerima** hasil dari VPS notifier:

```
POST /api/ews/notifications        → Simpan batch notifikasi baru
PUT  /api/ews/notifications/{id}   → Update status (sent/failed)
```

- [ ] Buat endpoint untuk **dashboard frontend**:

```
GET  /api/ews/notifications         → Daftar siswa berisiko (paginated, filter by status/level)
GET  /api/ews/notifications/{id}    → Detail 1 notifikasi + narasi AI
POST /api/ews/interventions         → Catat tindak lanjut
```

**Deliverable:** Database schema ready, API endpoints jalan (test pakai Postman/curl).

**Waktu:** ~3-4 jam

---

## Fase 3: Halaman Dashboard EWS (Frontend React)

**Tujuan:** Tampilkan data notifikasi di dashboard BK-EWS.

- [ ] Buat halaman `/ews` di React (Inertia):
  - Tabel siswa berisiko: nama, kelas, level risiko, skor, status notifikasi
  - Filter by: kategori risiko, status, periode
  - Sort by: skor risiko (desc), tanggal
- [ ] Buat halaman `/ews/{id}` — detail kasus:
  - Narasi AI (full text)
  - Metrik perilaku Moodle (tabel/chart)
  - Faktor pemicu (bullet list)
  - Form tindak lanjut (textarea catatan + dropdown jenis + submit)
- [ ] Buat badge/counter di sidebar: "🔴 3 siswa berisiko tinggi"

> [!TIP]
> Untuk fase ini, **seed data dummy** pakai output `sample_output.json` dari Fase 1. Kamu tidak perlu VPS atau LLM untuk mengerjakan frontend.

**Deliverable:** Halaman dashboard EWS berfungsi dengan data seeder.

**Waktu:** ~4-6 jam

---

## Fase 4: Setup VPS (LLM + Notifier)

**Tujuan:** Pasang llama-server dan ews-notifier di VPS.

Baru sekarang kamu sentuh VPS:

- [ ] Install llama-server
- [ ] Download `qwen2.5-0.5b-instruct-q4_k_m.gguf` (~400MB)
- [ ] Test llama-server bisa generate teks dari prompt EWS
- [ ] Buat `ews-notifier` (Node.js):
  - [ ] Endpoint `POST /generate` — terima JSON risiko, panggil llama-server, return narasi
  - [ ] Endpoint `POST /notify` — kirim WA via Baileys
  - [ ] Logic: generate narasi → kirim ke Laravel API (simpan ke DB) → kirim WA → update status
- [ ] Test end-to-end: kirim JSON sample → dapat narasi → tersimpan di DB Laravel

**Deliverable:** VPS bisa menerima JSON, generate narasi, dan simpan ke DB dashboard.

**Waktu:** ~4-6 jam

---

## Fase 5: Integrasi Baileys & Go-Live

**Tujuan:** Kirim WA asli ke guru.

- [ ] Siapkan nomor WA dedicated (SIM khusus)
- [ ] Setup Baileys di ews-notifier:
  - `syncFullHistory: false` (hemat RAM)
  - Auth state disimpan ke disk
  - Serialisasi pengiriman (jeda 3-8 detik)
- [ ] Scan QR sekali dari VPS
- [ ] Test kirim 1 pesan ke nomor sendiri
- [ ] Test kirim batch (5 pesan) dengan jeda
- [ ] Hubungkan ke cron/scheduler Laravel untuk trigger otomatis

**Deliverable:** Sistem EWS end-to-end berjalan: Moodle → Model → LLM → DB → WA → Dashboard.

**Waktu:** ~3-4 jam

---

## Ringkasan Timeline

```
Hari 1:  Fase 1 (test model lokal)           → 1-2 jam
         Fase 2 (migration + API Laravel)     → 3-4 jam

Hari 2:  Fase 3 (frontend dashboard EWS)     → 4-6 jam

Hari 3:  Fase 4 (VPS: llama-server + notifier) → 4-6 jam

Hari 4:  Fase 5 (Baileys + integrasi penuh)  → 3-4 jam
         Testing & debugging                  → 2-3 jam
```

> [!IMPORTANT]
> **Fase 1 bisa kamu mulai sekarang.** Kamu cuma butuh Python + joblib + pandas. Tidak perlu VPS, tidak perlu Laravel, tidak perlu internet. Itu yang harus kamu kerjakan malam ini.
