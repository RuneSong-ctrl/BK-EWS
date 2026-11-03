#!/usr/bin/env bash
# Cek kelengkapan VPS EWS (READ-ONLY: tidak mengubah, menginstal, atau menyalakan apa pun).
# Pakai:  bash cek_kelengkapan_vps.sh            -> cek ringan
#         bash cek_kelengkapan_vps.sh --llm-test -> + 1x uji generate Qwen (~10-20 dtk CPU)
# Jalankan sebagai user bk-ews. Perintah sudo memakai `sudo -n` (dilewati jika butuh password).

EWS_USER="${EWS_USER:-bk-ews}"
EWS_HOME="$(getent passwd "$EWS_USER" | cut -d: -f6)"
EWS_HOME="${EWS_HOME:-/home/$EWS_USER}"
PIPE="$EWS_HOME/pipeline"
LLM_DIR="$EWS_HOME/llm-server"
WA_DIR="$EWS_HOME/wa-gateway"
LLM_UNIT="bk-ews-llm.service"
LLM_TEST=0
[ "${1:-}" = "--llm-test" ] && LLM_TEST=1

PASS=0; WARN=0; FAIL=0
ok()   { echo "  [OK]   $*"; PASS=$((PASS+1)); }
warn() { echo "  [WARN] $*"; WARN=$((WARN+1)); }
fail() { echo "  [FAIL] $*"; FAIL=$((FAIL+1)); }
info() { echo "         $*"; }
section() { echo; echo "== $* =="; }
have() { command -v "$1" >/dev/null 2>&1; }

# Ambil nilai KEY dari file .env tanpa mencetaknya (dipakai internal saja)
env_get() { [ -f "$1" ] && grep -E "^$2=" "$1" | tail -n1 | cut -d= -f2- | tr -d '"'"'"; }

section "1. Sistem & Resource"
info "Host: $(hostname) | OS: $(. /etc/os-release 2>/dev/null; echo "${PRETTY_NAME:-?}") | Uptime: $(uptime -p 2>/dev/null)"
mem_avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
mem_total=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
swap_total=$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$mem_avail" -ge 600 ]; then ok "RAM tersedia ${mem_avail}/${mem_total} MiB"
elif [ "$mem_avail" -ge 350 ]; then warn "RAM tersedia tinggal ${mem_avail}/${mem_total} MiB (Qwen butuh ~450 MiB)"
else fail "RAM tersedia ${mem_avail}/${mem_total} MiB - terlalu sempit untuk LLM"; fi
[ "$swap_total" -gt 0 ] && ok "Swap aktif ${swap_total} MiB" || warn "Swap tidak aktif (risiko OOM saat LLM jalan)"
disk_pct=$(df -P "$EWS_HOME" 2>/dev/null | awk 'NR==2 {gsub("%","",$5); print $5}')
[ -n "$disk_pct" ] && { [ "$disk_pct" -lt 85 ] && ok "Disk terpakai ${disk_pct}%" || warn "Disk terpakai ${disk_pct}%"; }
info "Load average: $(cut -d' ' -f1-3 /proc/loadavg) | CPU core: $(nproc)"
info "Top 5 proses (CPU):"
ps -eo pid,user,%cpu,%mem,etime,comm --sort=-%cpu | head -n 6 | sed 's/^/           /'
if dmesg 2>/dev/null | grep -qi "out of memory\|oom-kill"; then warn "Ada jejak OOM-killer di dmesg"; fi

section "2. User terisolasi"
if id "$EWS_USER" >/dev/null 2>&1; then ok "User $EWS_USER ada (home: $EWS_HOME)"; else fail "User $EWS_USER belum dibuat"; fi
[ "$(id -un)" = "$EWS_USER" ] || warn "Skrip dijalankan sebagai $(id -un), bukan $EWS_USER (cek PM2/crontab bisa tidak akurat)"

section "3. Pipeline Python & Model ML ($PIPE)"
if [ -d "$PIPE" ]; then ok "Folder pipeline ada"; else fail "Folder $PIPE tidak ada"; fi
for f in ews_moodle_model.pkl course_mapping.csv test_pipeline.py ews_pipeline.py telegram_worker.py; do
  [ -f "$PIPE/$f" ] && ok "$f ($(du -h "$PIPE/$f" | cut -f1))" || fail "$f tidak ditemukan"
done
n_spool=$(ls "$PIPE"/spool/*.json 2>/dev/null | wc -l)
[ "$n_spool" -eq 0 ] && ok "Spool kosong (semua hasil pipeline sudah sampai ke Laravel)" || warn "$n_spool payload tertahan di spool/ (tunnel/Laravel mati saat pipeline jalan)"
PY="$PIPE/venv/bin/python"
if [ -x "$PY" ]; then
  ok "venv: $($PY --version 2>&1)"
  "$PY" - <<'EOF' 2>&1 | sed 's/^/         /'
import importlib
for m in ("numpy", "pandas", "sklearn", "joblib"):
    try:
        print(f"[OK]   {m} {importlib.import_module(m).__version__}")
    except Exception as e:
        print(f"[FAIL] {m}: {e}")
EOF
  if [ -f "$PIPE/ews_moodle_model.pkl" ]; then
    if out=$(cd "$PIPE" && timeout 60 "$PY" -c "import joblib; m=joblib.load('ews_moodle_model.pkl'); print(type(m).__name__)" 2>&1); then
      ok "Model ML bisa di-load: $(echo "$out" | tail -n1)"
    else
      fail "Model ML gagal di-load: $(echo "$out" | tail -n1)"
    fi
  fi
else
  fail "venv tidak ada di $PIPE/venv"
fi
if [ -f "$PIPE/.env" ]; then
  ok ".env pipeline ada (nilai tidak ditampilkan)"
  for k in LLM_API_URL LARAVEL_API_URL LARAVEL_API_KEY TELEGRAM_BOT_TOKEN; do
    [ -n "$(env_get "$PIPE/.env" "$k")" ] && ok "  $k terisi" || warn "  $k kosong/belum ada"
  done
  perm=$(stat -c %a "$PIPE/.env"); [ "$perm" = "600" ] || warn ".env permission $perm (sebaiknya 600)"
else
  warn ".env pipeline belum ada"
fi

section "4. Local LLM Qwen 0.5B ($LLM_DIR)"
gguf=$(ls "$LLM_DIR"/*.gguf 2>/dev/null | head -n1)
[ -n "$gguf" ] && ok "Model GGUF: $(basename "$gguf") ($(du -h "$gguf" | cut -f1))" || fail "File .gguf tidak ditemukan"
srv=$(ls "$LLM_DIR"/bin/*/llama-server 2>/dev/null | head -n1)
[ -x "$srv" ] && ok "Binary llama-server: $srv" || fail "Binary llama-server tidak ditemukan"
if systemctl list-unit-files "$LLM_UNIT" >/dev/null 2>&1 && systemctl cat "$LLM_UNIT" >/dev/null 2>&1; then
  st=$(systemctl is-active "$LLM_UNIT"); en=$(systemctl is-enabled "$LLM_UNIT" 2>/dev/null)
  [ "$st" = "active" ] && ok "$LLM_UNIT active ($en)" || fail "$LLM_UNIT status: $st ($en)"
  nres=$(systemctl show -p NRestarts --value "$LLM_UNIT" 2>/dev/null)
  [ "${nres:-0}" -le 3 ] && ok "Restart count: ${nres:-0}" || warn "Service sudah restart ${nres}x (crash loop?)"
  unit=$(systemctl cat "$LLM_UNIT" 2>/dev/null)
  for k in MemoryMax CPUQuota; do echo "$unit" | grep -q "^$k=" && ok "Pagar $(echo "$unit" | grep "^$k=")" || warn "Pagar $k belum dipasang"; done
  echo "$unit" | grep -q -- "--threads 1" && ok "--threads 1" || warn "--threads bukan 1"
  LLM_PORT=$(echo "$unit" | grep -oE -- "--port [0-9]+" | awk '{print $2}')
  echo "$unit" | grep -qE -- "--host 0\.0\.0\.0" && fail "llama-server bind ke 0.0.0.0 (terbuka ke internet!)"
  mem_now=$(systemctl show -p MemoryCurrent --value "$LLM_UNIT" 2>/dev/null)
  [[ "$mem_now" =~ ^[0-9]+$ ]] && info "Pemakaian RAM LLM saat ini: $((mem_now/1024/1024)) MiB"
else
  fail "Unit $LLM_UNIT belum terpasang"
fi
LLM_PORT="${LLM_PORT:-8080}"
if have curl; then
  h=$(curl -s -m 5 "http://127.0.0.1:$LLM_PORT/health")
  echo "$h" | grep -q '"ok"' && ok "Endpoint /health port $LLM_PORT: $h" || fail "LLM tidak merespons di port $LLM_PORT ($h)"
  if [ $LLM_TEST -eq 1 ]; then
    t0=$(date +%s)
    r=$(curl -s -m 90 "http://127.0.0.1:$LLM_PORT/v1/chat/completions" -H "Content-Type: application/json" \
      -d '{"messages":[{"role":"user","content":"Tulis satu kalimat sapaan formal untuk guru."}],"max_tokens":40,"temperature":0.2}')
    dt=$(( $(date +%s) - t0 ))
    tps=$(echo "$r" | grep -oE '"predicted_per_second":[0-9.]+' | cut -d: -f2)
    [ -n "$tps" ] && ok "Uji generate ${dt} dtk, ${tps} token/dtk" || fail "Uji generate gagal: $(echo "$r" | head -c 200)"
  fi
else
  fail "curl tidak terpasang"
fi

section "5. Gateway Telegram & sisa WhatsApp lama"
st=$(systemctl is-active ews-telegram.service 2>/dev/null)
[ "$st" = "active" ] && ok "ews-telegram.service active (restart: $(systemctl show -p NRestarts --value ews-telegram.service))" || fail "ews-telegram.service: ${st:-tidak terpasang}"
journalctl -u ews-telegram.service -n 3 --no-pager -o cat 2>/dev/null | sed 's/^/         /'
if have pm2; then
  pm2 jlist 2>/dev/null | grep -q '"name":"ews-wa-bot"' \
    && { pm2 describe ews-wa-bot 2>/dev/null | grep -E "status|restarts" | sed 's/^/         /'; warn "Proses PM2 ews-wa-bot masih terdaftar -> hentikan & hapus"; } \
    || ok "Tidak ada proses PM2 ews-wa-bot"
  pm2 jlist 2>/dev/null | grep -q '"pm_id"' && info "Proses PM2 lain: $(pm2 jlist 2>/dev/null | grep -oE '"name":"[^"]+"' | cut -d'"' -f4 | sort -u | tr '\n' ' ')"
else
  ok "PM2 tidak terpasang"
fi
pgrep -af "bot.mjs|baileys|send_test.mjs" >/dev/null && fail "Masih ada proses Baileys/Node berjalan: $(pgrep -af 'bot.mjs|baileys|send_test.mjs' | head -n3)" || ok "Tidak ada proses Baileys berjalan"
[ -d "$WA_DIR/auth_info_baileys" ] && warn "Sesi Baileys lama masih ada di $WA_DIR/auth_info_baileys (arsipkan/hapus manual)"

section "6. Jadwal (crontab $EWS_USER)"
ct=$(crontab -l -u "$EWS_USER" 2>/dev/null || crontab -l 2>/dev/null)
if [ -n "$ct" ]; then
  echo "$ct" | grep -v '^\s*#' | grep -v '^\s*$' | sed 's/^/         /'
  echo "$ct" | grep -v '^\s*#' | grep -qE '^\*\s' && warn "Ada cron yang jalan tiap menit - pastikan tidak memanggil LLM/API berulang"
else
  info "Crontab kosong"
fi
have systemctl && systemctl list-timers --all 2>/dev/null | grep -iE 'bk-ews|ews-' | sed 's/^/         /'

section "7. Jaringan & Keamanan"
if have ss; then
  info "Port LISTEN publik (bukan 127.0.0.1/::1):"
  ss -tlnH 2>/dev/null | awk '{print $4}' | grep -vE '^(127\.|\[::1\]|::1)' | sort -u | sed 's/^/           /'
  ss -tlnH 2>/dev/null | awk '{print $4}' | grep -qE "(0\.0\.0\.0|\*|\[::\]):$LLM_PORT$" && fail "Port LLM $LLM_PORT terbuka publik"
  est=$(ss -tnH state established 2>/dev/null | wc -l)
  [ "$est" -lt 200 ] && ok "Koneksi TCP established: $est" || warn "Koneksi TCP established tinggi: $est (cek trafik keluar!)"
fi
if sudo -n true 2>/dev/null; then
  sudo -n ufw status 2>/dev/null | head -n1 | grep -q active && ok "UFW aktif" || warn "UFW tidak aktif"
  sudo -n fail2ban-client status sshd >/dev/null 2>&1 && ok "fail2ban sshd aktif" || warn "fail2ban sshd tidak aktif"
else
  info "sudo butuh password - cek UFW/fail2ban dilewati"
fi
if have curl; then
  code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' https://api.telegram.org/)
  [ "$code" != "000" ] && ok "api.telegram.org terjangkau (HTTP $code)" || fail "api.telegram.org tidak terjangkau dari VPS"
  tok=$(env_get "$PIPE/.env" TELEGRAM_BOT_TOKEN)
  if [ -n "$tok" ]; then
    me=$(curl -s -m 8 "https://api.telegram.org/bot$tok/getMe")
    echo "$me" | grep -q '"ok":true' && ok "Token bot valid: @$(echo "$me" | grep -oE '"username":"[^"]+"' | cut -d'"' -f4)" || fail "Token bot Telegram ditolak"
  fi
  lurl=$(env_get "$PIPE/.env" LARAVEL_API_URL)
  if [ -n "$lurl" ]; then
    code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' "$lurl/bot/status")
    [ "$code" = "200" ] && ok "Laravel API terjangkau ($lurl)" || warn "Laravel API $lurl -> HTTP $code (tunnel/hosting belum jalan?)"
  fi
fi

section "RINGKASAN"
echo "  OK: $PASS | WARN: $WARN | FAIL: $FAIL"
[ $FAIL -eq 0 ] || exit 1
