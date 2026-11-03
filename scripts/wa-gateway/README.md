# WhatsApp Gateway Worker (Baileys) — E-Jurnal STIKMAS

Worker ini bertindak sebagai jembatan (*gateway*) antara sistem EWS Laravel dengan protokol WhatsApp Web menggunakan library `@whiskeysockets/baileys`.

## 🚀 Cara Menjalankan untuk Pengujian:

1. Buka terminal baru dan masuk ke direktori gateway ini:
   ```bash
   cd scripts/wa-gateway
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan bot:
   ```bash
   npm start
   ```

4. **Tautkan WhatsApp**:
   * Terminal akan menampilkan QR Code interaktif.
   * Buka aplikasi WhatsApp di HP Anda $\rightarrow$ **Perangkat Tertaut (*Linked Devices*)** $\rightarrow$ **Tautkan Perangkat** $\rightarrow$ Arahkan kamera ke QR Code di terminal.
   * Setelah sukses, status di Dashboard Admin (`/admin/dashboard`) otomatis berubah menjadi 🟢 **Terhubung**.

5. **Pengujian Pengiriman**:
   * Buka Dashboard Admin di browser (`http://127.0.0.1:8000/admin/dashboard`).
   * Pada panel **Monitoring Notifikasi WhatsApp**, klik tombol **"Uji Kirim WA Guru"**.
   * Masukkan nomor WhatsApp penguji / nomor tujuan.
   * Worker Baileys akan otomatis mengambil antrean, memberi jeda acak anti-spam, dan mengirimkan pesan nyata ke HP tujuan.
   * Status di Dashboard Admin otomatis berubah menjadi **SENT** lengkap dengan timestamp pengiriman.
