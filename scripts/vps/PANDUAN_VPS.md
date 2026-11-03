# Panduan Setup EWS VPS (Telegram Gateway)

Arsitektur: **VPS** = model ML + Qwen 0.5B + worker Telegram. **Laptop** = Laravel + database + dashboard.
Keduanya tersambung lewat SSH reverse tunnel (port 8000 laptop muncul sebagai `127.0.0.1:8000` di VPS).

## 0. Sekali saja: buat bot Telegram
1. Di Telegram, chat **@BotFather** → `/newbot` → beri nama, mis. `EWS SMKN 1 MAS`, username mis. `EwsSmkn1MasBot`.
2. Simpan **token** (jangan dibagikan). Username bot ditulis di `.env` laptop: `TELEGRAM_BOT_USERNAME=EwsSmkn1MasBot`.
3. Nilai `EWS_API_KEY` di `.env` laptop sudah dibuat otomatis — salin nilainya untuk langkah 2.

## 1. Upload file dari laptop (Git Bash, di folder proyek BK-EWS)
```bash
ssh bk-ews@IP_VPS "mkdir -p ~/ews-upload"
scp ../Model-BK-Ews/ews_moodle_model.pkl ../Model-BK-Ews/course_mapping.csv ../Model-BK-Ews/test_pipeline.py scripts/vps/* bk-ews@IP_VPS:~/ews-upload/
```

## 2. Setup di VPS
```bash
ssh bk-ews@IP_VPS
sudo bash ~/ews-upload/setup_vps.sh
nano ~/pipeline/.env          # isi EWS_API_KEY (sama dengan laptop) & TELEGRAM_BOT_TOKEN
sudo systemctl restart ews-telegram
```
Setup ini: mematikan & mengarsipkan bot WhatsApp lama, memasang fail2ban, mengunci scikit-learn 1.9.0
(versi saat model dilatih), memasang service `ews-telegram` (RAM maks 80 MB, berhenti sendiri jika
crash 5x dalam 10 menit), dan cron pipeline harian 06:00.

## 3. Nyalakan Laravel + tunnel (di laptop, 2 terminal)
```bash
php artisan migrate
php artisan serve --port=8000
```
```bash
ssh -N -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 8000:127.0.0.1:8000 bk-ews@IP_VPS
```
Cek dari VPS: `curl -s http://127.0.0.1:8000/api/ews/bot/status` → harus JSON.

## 4. Tautkan guru ke bot
```bash
php artisan ews:telegram-links --name="Admin Uji Coba"
```
Kirim tiap link ke guru yang bersangkutan (cukup diklik sekali → tekan **Start**).
Tautkan dirimu dulu lewat link "Admin Uji Coba" — tombol *Uji Kirim* di dashboard admin dikirim ke penerima ini.
Pesan untuk guru yang belum menautkan **tetap pending** dan otomatis terkirim begitu guru menautkan.

## 5. Uji & optimasi LLM (di VPS)
```bash
cd ~/pipeline && source venv/bin/activate
python ews_pipeline.py --dry-run      # cetak pesan + waktu tiap panggilan Qwen + tingkat lolos validasi
python ews_pipeline.py                # jalan penuh -> Laravel -> Telegram
journalctl -u ews-telegram -f         # pantau pengiriman
```
Target sehat: tiap panggilan Qwen ≤ 25 detik, lolos validasi ≥ 3 dari 4. Jika sering gagal validasi,
pesan tetap terkirim memakai template (fakta tetap benar karena disusun Python, bukan LLM).

## 6. Cek kelengkapan kapan saja
```bash
bash ~/ews-upload/cek_kelengkapan_vps.sh --llm-test
```

## Aturan notifikasi (threshold)
- Dinotifikasi jika: probabilitas ML ≥ 0.40 **atau** tidak aktif di LMS ≥ 3 hari **atau** tugas belum dikumpul ≥ 2.
- Siswa+mapel yang sama tidak dikirim ulang selama 7 hari, kecuali tingkat risikonya naik.
- 1 pesan rekap per guru per mapel (maks 15 siswa ditampilkan), 1 pesan rekap untuk Guru BK.
- Jika laptop/tunnel mati saat pipeline jalan, hasil disimpan di `~/pipeline/spool/` dan dikirim di run berikutnya.
