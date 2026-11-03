#!/usr/bin/env bash
# Mengumpulkan bukti (screenshot + log) untuk laporan KP dari VPS bk-ews.
# Pakai di VPS:
#   bash ambil_bukti_vps.sh              # bagian aman saja (tidak mengirim pesan ke guru)
#   bash ambil_bukti_vps.sh --full       # + jalankan pipeline penuh ke Laravel (pesan Telegram terkirim)
#   bash ambil_bukti_vps.sh --spool      # + uji spool (jalankan saat tunnel/laptop SENGAJA dimatikan)
# Semua keluaran juga disimpan ke ~/bukti_kp/<tanggal>/ untuk lampiran dan grafik.
# Token, chat_id, dan IP disamarkan otomatis. Tetap periksa ulang sebelum screenshot.

PIPE="${PIPE:-$HOME/pipeline}"
LLM_URL="${LLM_URL:-http://127.0.0.1:8080}"
OUT="$HOME/bukti_kp/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT"
FULL=0; SPOOL=0
for a in "$@"; do [ "$a" = "--full" ] && FULL=1; [ "$a" = "--spool" ] && SPOOL=1; done

mask() { sed -E 's/(bot)[0-9]+:[A-Za-z0-9_-]+/\1***TOKEN***/g; s/(start=)[A-Za-z0-9_-]+/\1***/g; s/("?chat_id"?[:=] ?"?)-?[0-9]{5,}/\1***/g; s/([0-9]{1,3}\.){3}[0-9]{1,3}/x.x.x.x/g; s/(X-EWS-(Key|Token): ?)[^ "]+/\1***/g'; }
sec() { echo; echo "=================================================================="; echo "[$1] $2   ($(date '+%d-%m-%Y %H:%M:%S %Z'))"; echo "=================================================================="; }
run() { local id="$1"; shift; local title="$1"; shift; { sec "$id" "$title"; "$@" 2>&1; } | mask | tee "$OUT/$id.txt"; }

# ---------------------------------------------------------------- S01 server
run S01 "Spesifikasi dan sumber daya VPS" bash -c '
  echo "OS     : $(. /etc/os-release; echo $PRETTY_NAME)"; echo "Kernel : $(uname -r)"; echo "CPU    : $(nproc) core ($(grep -m1 "model name" /proc/cpuinfo | cut -d: -f2 | xargs))"
  echo "Uptime : $(uptime -p)"; echo; free -h; echo; df -h / | sed 1d | awk "{print \"Disk / : \"\$3\" dipakai dari \"\$2\" (\"\$5\")\"}"
  echo; echo "Proses terbesar (RAM):"; ps -eo pid,user,%mem,rss,comm --sort=-rss | head -8'

# ---------------------------------------------------------------- S02-S03 layanan
run S02 "Layanan LLM bk-ews-llm (status + batas sumber daya)" bash -c '
  systemctl status bk-ews-llm --no-pager -l | head -15; echo
  systemctl show bk-ews-llm -p MemoryHigh -p MemoryMax -p CPUQuotaPerSecUSec -p MemoryCurrent -p NRestarts -p ActiveEnterTimestamp'
run S03 "Layanan worker Telegram ews-telegram" bash -c '
  systemctl status ews-telegram --no-pager -l | head -15; echo
  systemctl show ews-telegram -p MemoryMax -p MemoryCurrent -p NRestarts -p ActiveEnterTimestamp'

# ---------------------------------------------------------------- S04 log worker
run S04 "Log worker Telegram 24 jam terakhir (SENT/FAIL/WAIT)" bash -c '
  journalctl -u ews-telegram --since "24 hours ago" --no-pager -o short-iso | tail -60
  echo; echo "Ringkasan:"; for k in SENT FAIL WAIT; do printf "  %-5s %s\n" "$k" "$(journalctl -u ews-telegram --since "24 hours ago" --no-pager | grep -c "\[$k")"; done'

# ---------------------------------------------------------------- S05 LLM health + uji generasi
run S05 "Kesehatan llama-server dan uji generasi satu kalimat" bash -c '
  echo "GET /health -> $(curl -s '"$LLM_URL"'/health)"; echo
  START=$(date +%s.%N)
  RESP=$(curl -s '"$LLM_URL"'/v1/chat/completions -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"system\",\"content\":\"Kamu menulis SATU kalimat pembuka pesan resmi sekolah SMK untuk guru, dalam Bahasa Indonesia baku dan santun.\"},{\"role\":\"user\",\"content\":\"Penerima: guru mata pelajaran Basis Data. Jumlah siswa perlu perhatian: 3. Risiko tertinggi: TINGGI.\"}],\"temperature\":0.3,\"max_tokens\":70}")
  END=$(date +%s.%N)
  echo "$RESP" | python3 -c "import sys,json; r=json.load(sys.stdin); print(\"Kalimat   :\", r[\"choices\"][0][\"message\"][\"content\"].strip()); t=r.get(\"timings\",{}); u=r.get(\"usage\",{}); print(\"Token     :\", u.get(\"completion_tokens\")); print(\"Kecepatan :\", round(t.get(\"predicted_per_second\",0),2), \"token/detik\")"
  echo "Waktu total: $(python3 -c "print(round($END-$START,1))") detik"'

# ---------------------------------------------------------------- S06 halusinasi (E01)
[ -f "$PIPE/sample_output.json" ] || ( cd "$PIPE" && source venv/bin/activate && python test_pipeline.py >/dev/null 2>&1 )
run S06 "Uji halusinasi: Qwen diberi JSON mentah (bukti Bab III/IV)" bash -c '
  J=$(python3 -c "import json; d=json.load(open(\"'"$PIPE"'/sample_output.json\")); print(json.dumps(d[\"tier1_subject_teacher\"][0], ensure_ascii=False)[:1500])")
  P=$(python3 -c "import json,sys; print(json.dumps({\"messages\":[{\"role\":\"user\",\"content\":\"Tuliskan pesan WhatsApp untuk guru dari data berikut: \"+sys.argv[1]}],\"temperature\":0.7,\"max_tokens\":220}))" "$J")
  curl -s '"$LLM_URL"'/v1/chat/completions -H "Content-Type: application/json" -d "$P" | python3 -c "import sys,json; print(json.load(sys.stdin)[\"choices\"][0][\"message\"][\"content\"])"'

# ---------------------------------------------------------------- S07 dry-run + monitor sumber daya
sec S07 "Pipeline dry-run dengan pemantauan RAM/CPU per detik" | tee "$OUT/S07.txt"
( echo "detik,ram_tersedia_mib,llm_rss_mib,cpu_idle_pct"; t=0
  while [ ! -f "$OUT/.done" ]; do
    avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
    llm=$(ps -C llama-server -o rss= | awk '{s+=$1} END{print int(s/1024)}')
    idle=$(vmstat 1 2 | tail -1 | awk '{print $15}')
    echo "$t,$avail,$llm,$idle"; t=$((t+1)); done ) > "$OUT/S07_monitor.csv" &
MON=$!
T=""; [ -x /usr/bin/time ] && T="/usr/bin/time -v"
( cd "$PIPE" && source venv/bin/activate && $T python ews_pipeline.py --dry-run ) 2>&1 | mask | tee -a "$OUT/S07.txt"
touch "$OUT/.done"; wait $MON 2>/dev/null; rm -f "$OUT/.done"
echo "Data monitor tersimpan: $OUT/S07_monitor.csv (untuk grafik RAM/CPU di laporan)" | tee -a "$OUT/S07.txt"

# ---------------------------------------------------------------- S08 self-test
run S08 "Self-test skrip pipeline dan worker" bash -c "cd '$PIPE' && source venv/bin/activate && python ews_pipeline.py --self-test; python telegram_worker.py --self-test"

# ---------------------------------------------------------------- S09 jadwal & keamanan
run S09 "Jadwal cron dan pengamanan server" bash -c '
  echo "Crontab $(whoami):"; crontab -l 2>/dev/null | grep -v "^#"; echo
  echo "UFW:"; sudo -n ufw status 2>/dev/null || echo "(butuh sudo: jalankan sudo ufw status)"; echo
  echo "fail2ban:"; sudo -n fail2ban-client status sshd 2>/dev/null | head -8 || echo "(butuh sudo: sudo fail2ban-client status sshd)"; echo
  echo "Port yang mendengarkan:"; ss -ltnp 2>/dev/null | awk "NR==1||/:8080|:22 |:80 |:443 /"'

# ---------------------------------------------------------------- S10 galat lama (E02)
run S10 "Riwayat galat llama-server (kv cache, OOM, restart)" bash -c '
  journalctl -u bk-ews-llm --no-pager -o short-iso | grep -iE "kv cache|failed to find|out of memory|oom|killed|error" | tail -20 || true
  echo "(kosong berarti galat lama sudah terhapus dari journal; pakai screenshot lama bila ada)"'

# ---------------------------------------------------------------- S11/S12 opsional
if [ $FULL -eq 1 ]; then
  run S11 "Pipeline penuh ke Laravel (pesan Telegram akan terkirim)" bash -c "cd '$PIPE' && source venv/bin/activate && python ews_pipeline.py"
  sleep 25
  run S11b "Log worker setelah pipeline penuh" bash -c 'journalctl -u ews-telegram --since "3 minutes ago" --no-pager -o short-iso'
fi
if [ $SPOOL -eq 1 ]; then
  run S12 "Uji spool: server web sengaja dimatikan" bash -c "cd '$PIPE' && source venv/bin/activate && python ews_pipeline.py; echo; ls -la spool/"
fi

echo; echo "Selesai. Semua log ada di: $OUT"
