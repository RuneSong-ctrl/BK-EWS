"""
Gateway Telegram EWS (pengganti bot WhatsApp Baileys). Hanya library standar Python.

- Menautkan guru: guru klik link t.me/<bot>?start=<token> -> worker meneruskan ke Laravel.
- Mengambil antrean pending dari Laravel, mengirim lewat Bot API resmi, melapor sent/failed.
- Semua kegagalan memakai jeda yang makin panjang (maks 5 menit), tidak pernah retry beruntun.

Pakai:  python telegram_worker.py             (dijalankan systemd: ews-telegram.service)
        python telegram_worker.py --self-test
"""

import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent
SEND_GAP_SEC = 1.2          # jauh di bawah batas Telegram (30 pesan/detik global, 1/detik per chat)
HEARTBEAT_SEC = 30
MAX_BACKOFF_SEC = 300


def load_env():
    sys.path.insert(0, str(BASE))
    from ews_pipeline import load_env as _load
    env = _load(BASE / ".env")
    for k in ("LARAVEL_API_URL", "EWS_API_KEY", "TELEGRAM_BOT_TOKEN"):
        if not env.get(k):
            raise SystemExit(f"{k} belum diisi di {BASE / '.env'}")
    return env


def to_telegram_html(text):
    """Teks tersimpan memakai gaya *tebal*; ubah ke HTML Telegram dengan escape aman."""
    out = re.sub(r"\*([^*\n]+)\*", r"<b>\1</b>", html.escape(text, quote=False))
    return out if len(out) <= 4096 else out[:4000] + "\n…(selengkapnya di dashboard)"


class TelegramError(Exception):
    def __init__(self, code, desc, retry_after=None):
        super().__init__(f"{code} {desc}")
        self.code, self.desc, self.retry_after = code, desc, retry_after


class Worker:
    def __init__(self, env):
        self.env = env
        self.tg_base = env.get("TELEGRAM_API_BASE", "https://api.telegram.org").rstrip("/") + "/bot" + env["TELEGRAM_BOT_TOKEN"]
        self.api = env["LARAVEL_API_URL"].rstrip("/")
        self.offset = 0
        self.backoff = 5
        self.last_beat = 0
        self.bot_name = None

    # ---- HTTP helpers
    def tg(self, method, http_timeout=30, **params):
        req = urllib.request.Request(f"{self.tg_base}/{method}", data=json.dumps(params).encode(),
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=http_timeout) as r:
                return json.loads(r.read())["result"]
        except urllib.error.HTTPError as e:
            body = json.loads(e.read() or b"{}")
            raise TelegramError(e.code, body.get("description", ""), body.get("parameters", {}).get("retry_after"))

    def laravel(self, method, path, body=None):
        req = urllib.request.Request(self.api + path, method=method,
                                     data=json.dumps(body).encode() if body is not None else None,
                                     headers={"Content-Type": "application/json", "Accept": "application/json",
                                              "X-EWS-Key": self.env["EWS_API_KEY"]})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())

    def set_status(self, notif_id, status, error=None):
        self.laravel("PATCH", f"/notifications/{notif_id}/status", {"status": status, "error_message": error})

    # ---- tugas
    def heartbeat(self):
        if time.time() - self.last_beat >= HEARTBEAT_SEC:
            self.laravel("POST", "/bot/heartbeat", {"session_name": "primary_ews_bot", "status": "connected",
                                                    "phone_number": f"@{self.bot_name}"})
            self.last_beat = time.time()

    def handle_updates(self, poll_timeout):
        for u in self.tg("getUpdates", http_timeout=poll_timeout + 10, offset=self.offset,
                         timeout=poll_timeout, allowed_updates=["message"]):
            self.offset = u["update_id"] + 1
            msg = u.get("message") or {}
            text, chat = (msg.get("text") or "").strip(), msg.get("chat", {})
            if chat.get("type") != "private" or not text.startswith("/start"):
                continue
            token = text[len("/start"):].strip()
            reply = "Silakan buka link penautan khusus dari admin sekolah untuk mulai menerima notifikasi EWS."
            if token:
                try:
                    res = self.laravel("POST", "/telegram/link", {"token": token, "chat_id": str(chat["id"]),
                                                                   "username": chat.get("username")})
                    reply = f"✅ Akun Telegram ini tertaut sebagai: {res['recipient_name']}\nNotifikasi EWS akan dikirim ke sini."
                except urllib.error.HTTPError as e:
                    if e.code != 404:
                        raise
                    reply = "❌ Link penautan tidak valid. Minta link baru ke admin sekolah."
            self.tg("sendMessage", chat_id=chat["id"], text=reply)

    def send_pending(self):
        for n in self.laravel("GET", "/notifications/pending?limit=10").get("data", []):
            try:
                self.tg("sendMessage", chat_id=n["telegram_chat_id"], text=to_telegram_html(n["message_text"]),
                        parse_mode="HTML", disable_web_page_preview=True)
                self.set_status(n["id"], "sent")
                print(f"[SENT] #{n['id']} -> {n['recipient_name']}", flush=True)
            except TelegramError as e:
                if e.code == 429 or e.code >= 500:
                    self.set_status(n["id"], "pending")  # kembalikan ke antrean, coba nanti
                    time.sleep(min(e.retry_after or 30, MAX_BACKOFF_SEC))
                    return
                self.set_status(n["id"], "failed", f"Telegram {e}")  # 400/403: chat diblokir/tidak valid
                print(f"[FAIL] #{n['id']} {e}", flush=True)
            except (urllib.error.URLError, OSError) as e:
                self.set_status(n["id"], "pending")
                raise e
            time.sleep(SEND_GAP_SEC)

    def run(self):
        self.bot_name = self.tg("getMe")["username"]
        print(f"Bot @{self.bot_name} aktif, Laravel: {self.api}", flush=True)
        while True:
            try:
                self.heartbeat()
                self.send_pending()
                self.handle_updates(poll_timeout=20)  # long-poll: 1 request per 20 dtk saat sepi
                self.backoff = 5
            except TelegramError as e:
                if e.code == 401:
                    raise SystemExit("TELEGRAM_BOT_TOKEN ditolak Telegram (401). Worker berhenti.")
                self.pause(f"Telegram {e}", e.retry_after)
            except (urllib.error.URLError, OSError, ValueError) as e:
                self.pause(f"Laravel/jaringan: {e}")

    def pause(self, why, seconds=None):
        wait = min(seconds or self.backoff, MAX_BACKOFF_SEC)
        print(f"[WAIT {wait}s] {why}", flush=True)
        time.sleep(wait)
        self.backoff = min(self.backoff * 2, MAX_BACKOFF_SEC)


def self_test():
    assert to_telegram_html("Yth. *Guru <A>*, 1 & 2") == "Yth. <b>Guru &lt;A&gt;</b>, 1 &amp; 2"
    assert to_telegram_html("tanpa *tutup") == "tanpa *tutup"
    assert len(to_telegram_html("x" * 5000)) < 4096
    print("self-test OK")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
    else:
        Worker(load_env()).run()
