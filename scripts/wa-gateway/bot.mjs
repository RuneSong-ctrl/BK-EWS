import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import pino from "pino"
import axios from "axios"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Single Instance Protection via Atomic PID File (Anti-Race Condition & Anti-Stale)
const PID_FILE = path.join(__dirname, "bot.pid")

function acquirePidLock() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Flag 'wx': Exclusive file creation (O_CREAT | O_EXCL) di level kernel OS
      fs.writeFileSync(PID_FILE, String(process.pid), { flag: "wx" })
      return
    } catch (err) {
      if (err.code === "EEXIST") {
        try {
          const existingPid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10)
          if (!isNaN(existingPid)) {
            process.kill(existingPid, 0) // Cek apakah proses lama benar-benar hidup
            console.error(`❌ Instance bot lain sudah aktif (PID: ${existingPid}). Hentikan instance lama terlebih dahulu.`)
            process.exit(0)
          }
        } catch (killErr) {
          // Proses lama sudah mati (stale PID), bersihkan file lalu acquire ulang
          try {
            fs.unlinkSync(PID_FILE)
            continue
          } catch (_) {}
        }
      }
      console.error("❌ Gagal membuat PID lock file:", err.message)
      process.exit(1)
    }
  }
}

acquirePidLock()

// 2. Client HTTP dengan Timeout Baku 10 Detik (Anti-Hang)
const LARAVEL_BASE_URL = process.env.LARAVEL_URL || "http://127.0.0.1:8005"
const HTTP_TIMEOUT_MS = 10000
const POLLING_INTERVAL_MS = 5000
const HEARTBEAT_INTERVAL_MS = 30000
const MAX_RECONNECT_ATTEMPTS = 5

const http = axios.create({
  baseURL: LARAVEL_BASE_URL,
  timeout: HTTP_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// State Controller
let isProcessingQueue = false
let isConnected = false
let botPhoneNumber = null
let reconnectAttempts = 0
let currentSock = null
let reconnectTimer = null
let pollingTimer = null
let heartbeatTimer = null
let lastQrPayload = null

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function reportHeartbeat(status, qrPayload = null) {
  try {
    await http.post("/api/ews/bot/heartbeat", {
      session_name: "primary_ews_bot",
      status: status,
      phone_number: botPhoneNumber,
      qr_code_payload: qrPayload,
    })
  } catch (err) {
    // Info saja jika backend Laravel belum aktif, tidak crash bot
  }
}

async function processPendingNotifications(sock) {
  // Pagar 1: Validasi identitas socket aktif (Anti-Stale Socket Execution)
  if (isProcessingQueue || !isConnected || currentSock !== sock) return
  isProcessingQueue = true

  try {
    const res = await http.get("/api/ews/notifications/pending?limit=5")
    const notifications = res.data?.data || []

    for (const notif of notifications) {
      // Pagar 2: Pastikan socket saat ini masih yang memegang kontrol
      if (!isConnected || currentSock !== sock) break

      const rawPhone = String(notif.recipient_phone).replace(/[^0-9]/g, "")
      const formattedPhone = rawPhone.startsWith("0") ? "62" + rawPhone.slice(1) : rawPhone
      const jid = `${formattedPhone}@s.whatsapp.net`

      console.log(`\n📤 [SENDING] Memproses Notif ID #${notif.id} (${notif.recipient_type}) ke: ${notif.recipient_name} (${formattedPhone})...`)

      // Pagar 3: Jika backend belum auto-claim ke 'sending', klaim manual secara aman
      if (notif.status === "pending") {
        try {
          await http.patch(`/api/ews/notifications/${notif.id}/status`, {
            status: "sending",
          })
        } catch (lockErr) {
          console.warn(`⚠️ Gagal klaim status 'sending' untuk ID #${notif.id}, lewati.`)
          continue
        }
      }

      // Jeda santai 5–8 detik antar pesan (Anti-Burst & Anti-Ban Meta)
      await delay(Math.floor(Math.random() * 3000) + 5000)

      try {
        // Simulasi mengetik manusia (Presence update 'composing')
        try {
          await sock.sendPresenceUpdate("composing", jid)
          await delay(Math.floor(Math.random() * 1500) + 1500) // pura-pura mengetik 1.5 - 3 detik
          await sock.sendPresenceUpdate("paused", jid)
        } catch (_) {}

        await sock.sendMessage(jid, { text: notif.message_text })

        await http.patch(`/api/ews/notifications/${notif.id}/status`, {
          status: "sent",
        })
        console.log(`✅ [SUCCESS] Notif ID #${notif.id} berhasil terkirim ke ${formattedPhone}.`)
      } catch (sendErr) {
        console.error(`❌ [FAILED] Gagal kirim ID #${notif.id}:`, sendErr.message)
        try {
          await http.patch(`/api/ews/notifications/${notif.id}/status`, {
            status: "failed",
            error_message: sendErr.message || "Gagal kirim via Baileys",
          })
        } catch (_) {}
      }
    }
  } catch (err) {
    // Timeout atau error koneksi sementara ke Laravel ditangani tanpa crash
  } finally {
    isProcessingQueue = false
  }
}

function scheduleReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++
    const delayMs = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
    console.log(`🔄 Reconnect terjadwal ke-${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} dalam ${delayMs}ms...`)

    reconnectTimer = setTimeout(() => {
      startBaileysBot().catch((err) => {
        console.error("❌ Gagal saat rekoneksi:", err.message)
      })
    }, delayMs)
  } else {
    console.error("❌ Batas maksimal reconnect (5x) tercapai. Bot berhenti aman untuk melindungi jaringan.")
    shutdown(1)
  }
}

async function startBaileysBot() {
  if (currentSock) {
    try {
      currentSock.ev.removeAllListeners()
      currentSock.end(undefined)
    } catch (_) {}
    currentSock = null
  }

  const authPath = path.join(__dirname, "auth_info_baileys")
  const { state, saveCreds } = await useMultiFileAuthState(authPath)
  const { version } = await fetchLatestBaileysVersion()

  console.log(`\n======================================================`)
  console.log(`🤖 E-Jurnal STIKMAS — WhatsApp Gateway (Baileys v${version.join(".")})`)
  console.log(`🔗 Menghubungkan ke Backend Laravel: ${LARAVEL_BASE_URL}`)
  console.log(`📱 Identitas Perangkat: E-Jurnal STIKMAS (Chrome)`)
  console.log(`======================================================\n`)

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000,
    // Fingerprint resmi Ubuntu Chrome (Standar Resmi Meta, Bebas Curiga)
    browser: Browsers.ubuntu("Chrome"),
  })
  currentSock = sock

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    // Pagar Kunci: Abaikan event asynchronous jika bukan berasal dari socket aktif!
    if (currentSock !== sock) return

    const { connection, lastDisconnect, qr } = update

    if (qr && qr !== lastQrPayload) {
      lastQrPayload = qr
      console.log("\n📲 SCAN QR CODE INI MENGGUNAKAN WHATSAPP HP ADMIN:\n")
      qrcode.generate(qr, { small: true })
      await reportHeartbeat("qr_ready", qr)
    }

    if (connection === "close") {
      if (currentSock !== sock) return
      isConnected = false
      const statusCode = lastDisconnect?.error?.output?.statusCode

      console.log(`⚠️ Koneksi WhatsApp terputus (Status Code: ${statusCode})`)
      await reportHeartbeat("disconnected")

      // Sesi kadaluarsa / logout: Bersihkan folder auth agar tidak crash-loop di PM2
      if (
        statusCode === DisconnectReason.loggedOut ||
        statusCode === DisconnectReason.badSession ||
        statusCode === DisconnectReason.forbidden ||
        statusCode === DisconnectReason.connectionReplaced
      ) {
        console.error(`❌ Sesi tidak dapat dipulihkan (Code: ${statusCode}). Membersihkan sesi lama agar siap scan QR baru...`)
        try {
          fs.rmSync(authPath, { recursive: true, force: true })
        } catch (_) {}
        shutdown(1)
        return
      }

      scheduleReconnect()
    } else if (connection === "open") {
      if (currentSock !== sock) return

      isConnected = true
      reconnectAttempts = 0
      lastQrPayload = null

      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }

      botPhoneNumber = sock.user?.id ? sock.user.id.split(":")[0] : "Terhubung"
      console.log(`\n🎉 BOT WHATSAPP AKTIF & TERHUBUNG!`)
      console.log(`📱 Nomor WhatsApp Bot: +${botPhoneNumber}`)
      console.log(`💻 Terhubung sebagai: E-Jurnal STIKMAS`)
      console.log(`🚀 Siap memproses antrean notifikasi.`)
      console.log(`======================================================\n`)

      await reportHeartbeat("connected")
    }
  })
}

function shutdown(exitCode = 0) {
  console.log("\n🛑 Menutup bot secara aman (Graceful Shutdown)...")
  isConnected = false

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (pollingTimer) clearInterval(pollingTimer)
  if (heartbeatTimer) clearInterval(heartbeatTimer)

  if (currentSock) {
    try {
      currentSock.ev.removeAllListeners()
      currentSock.end(undefined)
    } catch (_) {}
    currentSock = null
  }

  // Hapus file lock PID secara aman jika milik proses ini
  try {
    if (fs.existsSync(PID_FILE)) {
      const currentPid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10)
      if (currentPid === process.pid) {
        fs.unlinkSync(PID_FILE)
      }
    }
  } catch (_) {}

  process.exit(exitCode)
}

process.on("SIGTERM", () => shutdown(0))
process.on("SIGINT", () => shutdown(0))

heartbeatTimer = setInterval(() => {
  reportHeartbeat(isConnected ? "connected" : "disconnected")
}, HEARTBEAT_INTERVAL_MS)

pollingTimer = setInterval(() => {
  if (isConnected && currentSock) {
    processPendingNotifications(currentSock)
  }
}, POLLING_INTERVAL_MS)

startBaileysBot().catch((err) => {
  console.error("❌ Fatal error saat inisialisasi awal:", err)
  shutdown(1)
})
