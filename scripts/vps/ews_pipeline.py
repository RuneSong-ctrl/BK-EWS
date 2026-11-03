"""
EWS Pipeline VPS: Model ML -> threshold & cooldown -> Class Digest -> Qwen 0.5B -> Laravel.

Pakai (di ~/pipeline, venv aktif):
  python ews_pipeline.py              # jalan penuh, kirim ke Laravel (gagal -> disimpan di spool/)
  python ews_pipeline.py --dry-run    # cetak pesan + waktu LLM, tidak kirim, tidak ubah state
  python ews_pipeline.py --self-test  # uji logika tanpa model/LLM/jaringan
  python ews_pipeline.py --features data.csv   # pakai fitur Moodle hasil ekstraksi (default: sampel simulasi)

Fungsi model & payload dipakai ulang dari test_pipeline.py (harus satu folder).
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent
SPOOL = BASE / "spool"
STATE_FILE = BASE / "notif_state.json"

# Ambang batas aturan (selain probabilitas ML >= threshold model)
RULE_INACTIVE_DAYS = 3      # tidak aktif di LMS >= 3 hari berturut-turut
RULE_MISSING_TASKS = 2      # tugas belum dikumpul >= 2
COOLDOWN_DAYS = 7           # siswa+mapel yang sama tidak dinotifikasi ulang kecuali risikonya naik
MAX_STUDENTS_PER_DIGEST = 15  # menjaga pesan di bawah batas 4096 karakter Telegram
LEVEL_RANK = {"RENDAH": 0, "SEDANG": 1, "TINGGI": 2}

BANNED_WORDS = ("mahasiswa", "kuliah", "dosen", "belanja", "aduk", "http", "www", "saya adalah", "sebagai ai")


def load_env(path):
    env = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return {**env, **{k: v for k, v in os.environ.items() if k in env or k.startswith(("EWS_", "LLM_", "LARAVEL_", "DASHBOARD_"))}}


# ---------------------------------------------------------------- threshold & cooldown

def apply_rules(alert):
    """Naikkan RENDAH -> SEDANG bila aturan pasti terpenuhi. Return True jika alert perlu dinotifikasi."""
    m = alert["metrik_24_fitur_model"]
    inactive = m["engagement_dan_durasi"]["days_inactive"]
    missing = m["kepatuhan_tugas"]["missing_assignments"]
    risk = alert["analisis_risiko"]
    rule_hits = []
    if inactive >= RULE_INACTIVE_DAYS:
        rule_hits.append(f"Tidak aktif di LMS {inactive} hari berturut-turut.")
    if missing >= RULE_MISSING_TASKS:
        rule_hits.append(f"{missing} tugas belum dikumpulkan.")
    if rule_hits and risk["tingkat_risiko"] == "RENDAH":
        risk["tingkat_risiko"] = "SEDANG"
        risk["dipicu_aturan"] = True
        alert["rekomendasi_tindakan"] = "Konfirmasi langsung ke siswa dan pantau aktivitas LMS minggu ini."
    for hit in rule_hits:
        if hit not in alert["faktor_pemicu"]:
            alert["faktor_pemicu"].insert(0, hit)
    return risk["tingkat_risiko"] in ("SEDANG", "TINGGI")


def due_for_notification(state, key, level, today):
    prev = state.get(key)
    if not prev:
        return True
    days = (today - date.fromisoformat(prev["date"])).days
    return days >= COOLDOWN_DAYS or LEVEL_RANK[level] > LEVEL_RANK[prev["level"]]


# ---------------------------------------------------------------- LLM (Qwen hanya menulis kalimat pembuka)

SYSTEM_PROMPT = (
    "Kamu menulis SATU kalimat pembuka pesan resmi sekolah SMK untuk guru, dalam Bahasa Indonesia baku dan santun. "
    "Jangan menyebut nama siswa, jangan membuat angka baru, jangan memakai kata mahasiswa/dosen/kuliah. "
    "Maksimal 35 kata. Tulis kalimatnya saja."
)
# Contoh per jenis penerima: 0.5B butuh contoh yang persis sejenis, tanpa itu kalimat BK jadi ngawur
OPENING_PREFIX = "Sistem deteksi dini Moodle mencatat"
FEW_SHOTS = {
    "mapel": ("Penerima: guru mata pelajaran Basis Data. Jumlah siswa perlu perhatian: 3. Risiko tertinggi: TINGGI.",
              "Sistem deteksi dini Moodle mencatat 3 siswa pada mata pelajaran Basis Data yang memerlukan "
              "perhatian segera agar ketertinggalan belajarnya dapat ditangani lebih awal."),
    "bk": ("Penerima: guru bimbingan konseling. Jumlah siswa perlu perhatian: 3. Risiko tertinggi: TINGGI.",
           "Sistem deteksi dini Moodle mencatat 3 siswa yang memerlukan tindak lanjut bimbingan konseling "
           "karena kendala belajar terlihat di lebih dari satu mata pelajaran."),
}


def validate_opening(text, allowed_numbers, mapel=None):
    """Return kalimat bersih jika lolos validasi, selain itu None (pakai template)."""
    text = " ".join(text.replace("*", "").split()).strip().strip('"')
    if not (30 <= len(text) <= 320) or not text.startswith(OPENING_PREFIX):
        return None  # struktur kalimat di luar pola contoh = rawan ngawur
    low = text.lower()
    if mapel and "pelajaran" in low and mapel.lower() not in low and mapel.split(" dan ")[0].lower() not in low:
        return None  # nama mapel dikarang
    if any(w in low for w in BANNED_WORDS):
        return None
    if any(n not in allowed_numbers for n in re.findall(r"\d+", text)):
        return None  # angka halusinasi
    words = low.split()
    grams = [" ".join(words[i:i + 5]) for i in range(len(words) - 4)]
    if len(grams) != len(set(grams)):
        return None  # kalimat berulang (loop)
    if not text.endswith((".", "!")):
        text = text.rstrip(",;:") + "."
    return text


def llm_opening(env, audience, n_students, top_level, stats, mapel=None):
    user = f"Penerima: {audience}. Jumlah siswa perlu perhatian: {n_students}. Risiko tertinggi: {top_level}."
    shot_user, shot_assistant = FEW_SHOTS["mapel" if mapel else "bk"]
    payload = {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": shot_user},
            {"role": "assistant", "content": shot_assistant},
            {"role": "user", "content": user},
        ],
        "temperature": 0.3,
        "max_tokens": 70,
        "repeat_penalty": 1.15,
        "stop": ["<|im_end|>", "\n"],
    }
    t0 = time.time()
    try:
        req = urllib.request.Request(env.get("LLM_API_URL", "http://127.0.0.1:8080/v1/chat/completions"),
                                     data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=int(env.get("LLM_TIMEOUT_SEC", "60"))) as r:
            raw = json.loads(r.read())["choices"][0]["message"]["content"]
        text = validate_opening(raw, {str(n_students)}, mapel)
        stats.append({"detik": round(time.time() - t0, 1), "lolos": bool(text), "raw": raw})
        return text
    except Exception as e:
        stats.append({"detik": round(time.time() - t0, 1), "lolos": False, "raw": f"ERROR {e}"})
        return None


# ---------------------------------------------------------------- penyusun pesan (fakta dari Python, bukan LLM)

def student_line(i, a):
    m = a["metrik_24_fitur_model"]
    parts = []
    if m["kepatuhan_tugas"]["missing_assignments"]:
        parts.append(f"{m['kepatuhan_tugas']['missing_assignments']} tugas belum dikumpul")
    if m["engagement_dan_durasi"]["days_inactive"] >= RULE_INACTIVE_DAYS:
        parts.append(f"tidak aktif {m['engagement_dan_durasi']['days_inactive']} hari")
    parts.append(f"durasi belajar {m['engagement_dan_durasi']['course_duration_hours']} jam")
    parts.append(f"nilai rata-rata {m['akademik']['avg_score']}")
    return (f"{i}. *{a['nama_siswa']}* ({a['kelas']}) - risiko {a['analisis_risiko']['tingkat_risiko']}\n"
            f"   ⚠️ {', '.join(parts)}.")


def build_teacher_digest(env, guru, mapel, kkm, alerts, stats, use_llm=True):
    alerts = sorted(alerts, key=lambda a: -a["analisis_risiko"]["probabilitas_risiko"])
    top = max(alerts, key=lambda a: LEVEL_RANK[a["analisis_risiko"]["tingkat_risiko"]])["analisis_risiko"]["tingkat_risiko"]
    n = len(alerts)
    opening = (use_llm and llm_opening(env, f"guru mata pelajaran {mapel}", n, top, stats, mapel)) or (
        f"Sistem deteksi dini Moodle mencatat {n} siswa pada mata pelajaran {mapel} yang memerlukan perhatian Bapak/Ibu.")
    shown = alerts[:MAX_STUDENTS_PER_DIGEST]
    lines = [student_line(i, a) for i, a in enumerate(shown, 1)]
    if n > len(shown):
        lines.append(f"...dan {n - len(shown)} siswa lainnya (lihat dashboard).")
    return (
        "📢 *[EWS ALERT TIER 1 - SMKN 1 MAS]*\n\n"
        f"Yth. *{guru}*,\n{opening}\n\n"
        f"📚 *Mata Pelajaran*: {mapel} (KKM: {kkm})\n"
        f"👥 *Siswa perlu perhatian*: {n} orang\n\n" + "\n".join(lines) + "\n\n"
        "Mohon kesediaan Bapak/Ibu untuk mengonfirmasi tugas susulan atau mengagendakan program remedial.\n"
        f"🔗 Dashboard Guru Mapel: {env.get('DASHBOARD_URL', 'http://127.0.0.1:8000')}/dashboard"
    ), top


def build_bk_digest(env, summaries, stats, use_llm=True):
    summaries = sorted(summaries, key=lambda s: -LEVEL_RANK[s["prioritas_konseling"]])
    top = summaries[0]["prioritas_konseling"]
    n = len(summaries)
    opening = (use_llm and llm_opening(env, "guru bimbingan konseling", n, top, stats)) or (
        f"Sistem deteksi dini Moodle mencatat {n} siswa yang memerlukan tindak lanjut bimbingan konseling.")
    lines = []
    for i, s in enumerate(summaries[:MAX_STUDENTS_PER_DIGEST], 1):
        r = s["rekapitulasi_semester"]
        lines.append(
            f"{i}. *{s['nama_siswa']}* ({s['kelas']}) - prioritas {s['prioritas_konseling']}\n"
            f"   ⚠️ {r['total_mapel_berisiko']} dari {r['total_mapel_diambil']} mapel berisiko, "
            f"{r['total_tugas_belum_dikumpul']} tugas belum dikumpul, tidak aktif terlama {r['inaktivitas_terlama_hari']} hari.\n"
            f"   🧭 {s['profil_karakter_belajar']}")
    if n > MAX_STUDENTS_PER_DIGEST:
        lines.append(f"...dan {n - MAX_STUDENTS_PER_DIGEST} siswa lainnya (lihat dashboard).")
    return (
        "🛡️ *[EWS TRIAGE TIER 2 - GURU BK]*\n\n"
        f"Yth. *Bapak/Ibu Guru BK*,\n{opening}\n\n" + "\n".join(lines) + "\n\n"
        "Mohon dijadwalkan konseling sesuai prioritas di atas.\n"
        f"🔗 Dashboard Guru BK: {env.get('DASHBOARD_URL', 'http://127.0.0.1:8000')}/dashboard"
    ), top


# ---------------------------------------------------------------- kirim ke Laravel + spool

def post_json(env, path, body):
    req = urllib.request.Request(
        env["LARAVEL_API_URL"].rstrip("/") + path, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json", "X-EWS-Key": env.get("EWS_API_KEY", "")})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def deliver(env, path, body):
    """Kirim; jika Laravel/tunnel mati, simpan ke spool agar dikirim ulang pada run berikutnya."""
    try:
        print(f"  -> POST {path}: {post_json(env, path, body).get('message')}")
    except urllib.error.HTTPError as e:
        if e.code in (401, 422, 503):  # salah konfigurasi/data: jangan diulang diam-diam
            raise SystemExit(f"Laravel menolak {path}: HTTP {e.code} {e.read()[:300]!r}")
        spool(path, body, e)
    except (urllib.error.URLError, OSError) as e:
        spool(path, body, e)


def spool(path, body, err):
    SPOOL.mkdir(exist_ok=True)
    f = SPOOL / f"{datetime.now():%Y%m%d_%H%M%S_%f}_{path.strip('/').replace('/', '_')}.json"
    f.write_text(json.dumps({"path": path, "body": body}, ensure_ascii=False), encoding="utf-8")
    print(f"  !! Laravel tidak terjangkau ({err}); disimpan ke {f.name}")


def flush_spool(env):
    for f in sorted(SPOOL.glob("*.json")) if SPOOL.exists() else []:
        item = json.loads(f.read_text(encoding="utf-8"))
        try:
            post_json(env, item["path"], item["body"])
            f.unlink()
            print(f"  -> spool {f.name} terkirim")
        except (urllib.error.URLError, OSError) as e:
            print(f"  !! spool masih tertahan ({e}); coba lagi run berikutnya")
            return


# ---------------------------------------------------------------- main

def run_model(features_csv):
    sys.path.insert(0, str(BASE))
    import pandas as pd
    import test_pipeline as tp

    os.chdir(BASE)
    bundle = tp.load_ews_bundle()
    df = pd.read_csv(features_csv) if features_csv else tp.prepare_multi_course_samples(bundle["course_mapping"])
    if features_csv:  # gabungkan metadata mapel seperti di test_pipeline
        for col in ("nama_mapel", "kategori_mapel", "nama_guru_mapel", "kkm"):
            df[col] = df["code_module"].map(lambda m: bundle["course_mapping"].get(m, {}).get(col))
    probs = bundle["model"].predict_proba(df[bundle["feature_cols"]])[:, 1]
    tier1 = [tp.generate_subject_teacher_payload(row, p, bundle["threshold"]) for (_, row), p in zip(df.iterrows(), probs)]
    tier2 = [tp.generate_bk_student_summary(sid, df, bundle["model"], bundle["feature_cols"], bundle["threshold"])
             for sid in df["id_student"].unique()]
    return tier1, tier2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--no-llm", action="store_true")
    ap.add_argument("--features")
    args = ap.parse_args()
    if args.self_test:
        return self_test()

    env = load_env(BASE / ".env")
    if not args.dry_run:
        for k in ("LARAVEL_API_URL", "EWS_API_KEY"):
            if not env.get(k):
                raise SystemExit(f"{k} belum diisi di {BASE / '.env'}")
        flush_spool(env)

    t0 = time.time()
    tier1, tier2 = run_model(args.features)
    today = date.today()
    state = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
    stats = []

    groups = {}
    for a in tier1:
        if apply_rules(a):
            key = f"t1|{a['id_siswa']}|{a['mata_pelajaran']['kode_modul']}"
            if due_for_notification(state, key, a["analisis_risiko"]["tingkat_risiko"], today):
                mp = a["mata_pelajaran"]
                groups.setdefault((mp["guru_pengampu"], mp["nama_mapel"], mp["kkm"]), []).append((key, a))

    digests, new_state = [], {}
    for (guru, mapel, kkm), items in groups.items():
        text, top = build_teacher_digest(env, guru, mapel, kkm, [a for _, a in items], stats, not args.no_llm)
        digests.append({"guru_pengampu": guru, "nama_mapel": mapel, "risk_level": top, "wa_message": text})
        new_state.update({k: {"date": today.isoformat(), "level": a["analisis_risiko"]["tingkat_risiko"]} for k, a in items})

    bk_due = [s for s in tier2 if s["prioritas_konseling"] in ("TINGGI", "SEDANG")
              and due_for_notification(state, f"t2|{s['id_siswa']}", s["prioritas_konseling"], today)]
    bk_digests = []
    if bk_due:
        text, top = build_bk_digest(env, bk_due, stats, not args.no_llm)
        bk_digests.append({"risk_level": top, "wa_message": text})
        new_state.update({f"t2|{s['id_siswa']}": {"date": today.isoformat(), "level": s["prioritas_konseling"]} for s in bk_due})

    print(f"Model: {len(tier1)} rekaman mapel, {len(tier2)} siswa | digest guru: {len(digests)}, digest BK: {len(bk_digests)}")
    for s in stats:
        print(f"  LLM {s['detik']:>5}s lolos={s['lolos']} | {s['raw'][:120]!r}")
    if stats:
        print(f"  LLM lolos validasi {sum(s['lolos'] for s in stats)}/{len(stats)} (sisanya pakai template)")

    if args.dry_run:
        for d in digests + bk_digests:
            print("-" * 60 + "\n" + d["wa_message"])
    else:
        deliver(env, "/tier1/alerts", {"tier1_subject_teacher": tier1, "digests": digests})
        deliver(env, "/tier2/summaries", {"tier2_counselor_bk": tier2, "bk_digests": bk_digests})
        state.update(new_state)  # di-spool pun tetap dihitung: akan terkirim saat Laravel kembali
        STATE_FILE.write_text(json.dumps(state, indent=1))
    print(f"Selesai dalam {time.time() - t0:.1f} detik")


def self_test():
    def alert(inactive, missing, level="RENDAH", prob=0.2):
        return {"id_siswa": 1, "nama_siswa": "Siswa Uji", "kelas": "X-RPL-1",
                "mata_pelajaran": {"kode_modul": "AAA", "nama_mapel": "Web", "guru_pengampu": "Guru A", "kkm": 75},
                "analisis_risiko": {"tingkat_risiko": level, "probabilitas_risiko": prob},
                "metrik_24_fitur_model": {"engagement_dan_durasi": {"days_inactive": inactive, "course_duration_hours": 4.5},
                                          "kepatuhan_tugas": {"missing_assignments": missing}, "akademik": {"avg_score": 40.0}},
                "faktor_pemicu": [], "rekomendasi_tindakan": ""}

    assert not apply_rules(alert(2, 1))
    a = alert(3, 0)
    assert apply_rules(a) and a["analisis_risiko"]["tingkat_risiko"] == "SEDANG" and "3 hari" in a["faktor_pemicu"][0]
    assert apply_rules(alert(0, 2))
    assert apply_rules(alert(0, 0, "TINGGI", 0.9))

    today = date(2026, 10, 26)
    st = {"k": {"date": "2026-10-22", "level": "SEDANG"}}
    assert not due_for_notification(st, "k", "SEDANG", today)
    assert due_for_notification(st, "k", "TINGGI", today)
    assert due_for_notification({"k": {"date": "2026-10-19", "level": "SEDANG"}}, "k", "SEDANG", today)
    assert due_for_notification({}, "k", "SEDANG", today)

    good = "Sistem deteksi dini Moodle mencatat 2 siswa yang memerlukan perhatian Bapak/Ibu"
    assert validate_opening(good, {"2"}) == good + "."
    # kasus nyata dari Qwen di VPS 26-10-2026
    assert validate_opening("Sistem deteksi dini Moodle mencatat satu siswa pada mata pelajaran Model Pengolahan Data "
                            "yang memerlukan perhatian.", {"1"}, "Pemodelan Perangkat Lunak") is None
    assert validate_opening("Sistem deteksi dini Moodle mencatat dua siswa pada mata pelajaran Pemrograman Web yang "
                            "memerlukan perhatian.", {"2"}, "Pemrograman Web dan Perangkat Bergerak")
    assert validate_opening("Kepada guru yang berperan sebagai bimbingan konseling, jadwal pertanyaan dan kesempatan "
                            "untuk memahami aspek asal.", {"2"}) is None
    assert validate_opening(good.replace("2", "16"), {"2"}) is None
    assert validate_opening("Mohon perhatian untuk mahasiswa berikut yang tertinggal tugas", {"2"}) is None
    assert validate_opening("mohon berikan tugas yang perlu dikirimkan mohon berikan tugas yang perlu dikirimkan", {"2"}) is None
    assert validate_opening("Halo.", {"2"}) is None

    text, top = build_teacher_digest({}, "Guru A", "Web", 75, [alert(16, 2, "TINGGI", 0.9)] * 20, [], use_llm=False)
    assert top == "TINGGI" and "...dan 5 siswa lainnya" in text and len(text) < 4096
    print("self-test OK")


if __name__ == "__main__":
    main()
