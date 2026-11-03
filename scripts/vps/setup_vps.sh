#!/usr/bin/env bash
# Setup EWS di VPS (idempoten, aman diulang). Jalankan sebagai root:
#   sudo bash ~/ews-upload/setup_vps.sh
# Prasyarat: folder ~bk-ews/ews-upload berisi file dari laptop (lihat PANDUAN_VPS.md).
set -euo pipefail

EWS_USER=bk-ews
H=/home/$EWS_USER
UP=$H/ews-upload
PIPE=$H/pipeline
[ "$(id -u)" -eq 0 ] || { echo "Jalankan dengan sudo"; exit 1; }
[ -d "$UP" ] || { echo "Folder $UP tidak ada"; exit 1; }
as_user() { sudo -u "$EWS_USER" -H bash -c "$1"; }

echo "== 1. Matikan & arsipkan gateway WhatsApp lama"
as_user "command -v pm2 >/dev/null && { pm2 delete ews-wa-bot 2>/dev/null || true; pm2 save --force >/dev/null 2>&1 || true; } || true"
if [ -d "$H/wa-gateway" ]; then
  tar -czf "$H/arsip-wa-gateway-$(date +%Y%m%d).tar.gz" -C "$H" wa-gateway
  rm -rf "$H/wa-gateway"
  chown "$EWS_USER:" "$H"/arsip-wa-gateway-*.tar.gz
  echo "   diarsipkan ke $H/arsip-wa-gateway-$(date +%Y%m%d).tar.gz"
fi

echo "== 2. Paket sistem (fail2ban)"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fail2ban >/dev/null
cat > /etc/fail2ban/jail.d/sshd-ews.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
EOF
systemctl enable --now fail2ban >/dev/null
systemctl restart fail2ban

echo "== 3. File pipeline"
as_user "mkdir -p $PIPE/spool $PIPE/logs"
for f in ews_moodle_model.pkl course_mapping.csv test_pipeline.py ews_pipeline.py telegram_worker.py requirements-vps.txt; do
  install -o "$EWS_USER" -g "$EWS_USER" -m 644 "$UP/$f" "$PIPE/$f"
done

echo "== 4. Dependensi Python (versi dikunci sama dengan saat model dilatih)"
[ -x "$PIPE/venv/bin/python" ] || as_user "python3 -m venv $PIPE/venv"
as_user "$PIPE/venv/bin/pip install -q --upgrade pip && $PIPE/venv/bin/pip install -q -r $PIPE/requirements-vps.txt"
as_user "cd $PIPE && venv/bin/python -c \"import joblib,warnings; warnings.simplefilter('error'); b=joblib.load('ews_moodle_model.pkl'); print('   model OK:', type(b['model']).__name__, len(b['feature_cols']), 'fitur')\""
as_user "cd $PIPE && venv/bin/python ews_pipeline.py --self-test && venv/bin/python telegram_worker.py --self-test"

echo "== 5. File .env (tidak ditimpa jika sudah ada)"
if [ ! -f "$PIPE/.env" ]; then
  install -o "$EWS_USER" -g "$EWS_USER" -m 600 "$UP/env.example" "$PIPE/.env"
  echo "   .env dibuat dari template -> ISI EWS_API_KEY & TELEGRAM_BOT_TOKEN: nano $PIPE/.env"
fi
chmod 600 "$PIPE/.env"

echo "== 6. Service worker Telegram"
cat > /etc/systemd/system/ews-telegram.service <<EOF
[Unit]
Description=BK-EWS Telegram Gateway Worker
After=network-online.target
Wants=network-online.target
# Maksimal 5 kali gagal start dalam 10 menit, lalu berhenti (anti crash-loop / trafik liar)
StartLimitIntervalSec=600
StartLimitBurst=5

[Service]
Type=simple
User=$EWS_USER
WorkingDirectory=$PIPE
ExecStart=$PIPE/venv/bin/python -u $PIPE/telegram_worker.py
Restart=on-failure
RestartSec=30
MemoryMax=80M
CPUQuota=20%
Nice=10

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable ews-telegram.service >/dev/null
if grep -qE '^TELEGRAM_BOT_TOKEN=.+' "$PIPE/.env" && grep -qE '^EWS_API_KEY=.+' "$PIPE/.env"; then
  systemctl restart ews-telegram.service && echo "   ews-telegram aktif"
else
  echo "   ews-telegram BELUM dijalankan (.env belum lengkap). Setelah diisi: sudo systemctl restart ews-telegram"
fi

echo "== 7. Jadwal pipeline harian 06:00 (flock mencegah run ganda)"
CRON="0 6 * * * cd $PIPE && /usr/bin/flock -n /tmp/ews-pipeline.lock venv/bin/python ews_pipeline.py >> logs/pipeline.log 2>&1"
( crontab -u "$EWS_USER" -l 2>/dev/null | grep -v 'ews_pipeline.py' ; echo "$CRON" ) | crontab -u "$EWS_USER" -
crontab -u "$EWS_USER" -l | grep ews_pipeline

echo
echo "SELESAI. Cek ulang:  sudo -u $EWS_USER bash $UP/cek_kelengkapan_vps.sh"
