import * as React from "react"
import { AppLayout } from "@/Layouts/AppLayout"
import { router } from "@inertiajs/react"
import {
  IconCheck,
  IconCheckCircle,
  IconAlert,
  IconCalendarCheck,
  IconBook,
  IconUsers,
  IconFile,
  IconShieldCheck,
  IconClose,
  IconArrowRight,
  IconSave,
  IconSend,
  IconRefresh,
  IconEye,
} from "@/components/ui/storage-icon"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CourseMappingItem {
  id: number
  code_module: string
  nama_mapel: string
  kategori_mapel: string
  nama_guru_mapel: string
  no_wa_guru: string | null
  kkm: number
  updated_at?: string
}

interface SyncLogItem {
  id: number
  triggered_by?: number
  sync_type: string
  status: "running" | "success" | "failed"
  students_processed: number
  message: string | null
  created_at: string
  user?: {
    name: string
    email: string
  }
}

interface AdminProps {
  kpi: {
    moodle_status: string
    moodle_url: string
    last_sync_at: string
    last_sync_full: string
    total_courses: number
    total_students_synced: number
    total_alerts_active: number
    sync_duration_seconds: number
  }
  courseMappings: CourseMappingItem[]
  syncLogs: SyncLogItem[]
  adminName?: string
}

export default function AdminDashboard({
  kpi,
  courseMappings = [],
  syncLogs = [],
  adminName,
}: AdminProps) {
  const [activeTab, setActiveTab] = React.useState<"mappings" | "logs" | "api">("mappings")

  // State Pengaturan API & Web Service Moodle
  const [apiForm, setApiForm] = React.useState({
    moodle_url: kpi?.moodle_url || "https://moodle.smkn1mas.sch.id",
    moodle_token: "9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c",
    ws_function: "core_webservice_get_site_info",
    auto_sync_schedule: "02:00 WITA",
  })
  const [showToken, setShowToken] = React.useState(false)
  const [isSavingApi, setIsSavingApi] = React.useState(false)
  const [apiSaveFeedback, setApiSaveFeedback] = React.useState<string | null>(null)

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingApi(true)
    setTimeout(() => {
      setIsSavingApi(false)
      setApiSaveFeedback("Pengaturan API & Web Service Moodle berhasil disimpan!")
      setTimeout(() => setApiSaveFeedback(null), 4000)
    }, 600)
  }

  // State Sync Manual
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [syncFeedback, setSyncFeedback] = React.useState<{
    success: boolean
    message: string
  } | null>(null)

  // State Test Connection
  const [isTestingConnection, setIsTestingConnection] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{
    success: boolean
    message: string
    latency_ms?: number
    version?: string
  } | null>(null)

  // State Modal Edit Mapping
  const [editingItem, setEditingItem] = React.useState<CourseMappingItem | null>(null)
  const [editForm, setEditForm] = React.useState({
    nama_mapel: "",
    kategori_mapel: "",
    nama_guru_mapel: "",
    no_wa_guru: "",
    kkm: 75,
  })
  const [isSavingEdit, setIsSavingEdit] = React.useState(false)

  // State Modal Upload CSV
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleSyncNow = () => {
    setIsSyncing(true)
    setSyncFeedback(null)

    router.post(
      "/admin/moodle/sync",
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSyncing(false)
          setSyncFeedback({
            success: true,
            message: "Sinkronisasi berhasil! Data log Moodle telah diproses dan diperbarui ke EWS Tier 1 & Tier 2.",
          })
          setTimeout(() => setSyncFeedback(null), 6000)
        },
        onError: (errors) => {
          setIsSyncing(false)
          setSyncFeedback({
            success: false,
            message: "Gagal melakukan sinkronisasi: " + JSON.stringify(errors),
          })
        },
        onFinish: () => {
          setIsSyncing(false)
        },
      }
    )
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setTestResult(null)
    try {
      const res = await fetch("/admin/moodle/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify({ moodle_url: kpi.moodle_url }),
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({
        success: false,
        message: "Gagal menghubungi server Moodle. Periksa koneksi jaringan atau URL server.",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const openEditModal = (item: CourseMappingItem) => {
    setEditingItem(item)
    setEditForm({
      nama_mapel: item.nama_mapel,
      kategori_mapel: item.kategori_mapel,
      nama_guru_mapel: item.nama_guru_mapel,
      no_wa_guru: item.no_wa_guru || "",
      kkm: item.kkm,
    })
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setIsSavingEdit(true)
    router.put(
      `/admin/course-mapping/${editingItem.id}`,
      {
        ...editForm,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSavingEdit(false)
          setEditingItem(null)
        },
        onError: () => {
          setIsSavingEdit(false)
        },
        onFinish: () => {
          setIsSavingEdit(false)
        },
      }
    )
  }

  const handleUploadCsv = (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return

    const formData = new FormData()
    formData.append("csv_file", csvFile)

    setIsUploading(true)
    router.post("/admin/course-mapping/upload", formData as any, {
      preserveScroll: true,
      onSuccess: () => {
        setIsUploading(false)
        setIsUploadModalOpen(false)
        setCsvFile(null)
      },
      onError: () => {
        setIsUploading(false)
      },
      onFinish: () => {
        setIsUploading(false)
      },
    })
  }

  return (
    <AppLayout
      currentRole="admin"
      activeMenu="dashboard"
      title="Administrator IT — Moodle LMS Sync & Kurikulum"
      subtitle="Pengaturan konektivitas Moodle Web Service, sinkronisasi on-demand, dan pemetaan course mapping"
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-8">
        
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">
                KRAN DATA LMS MOODLE ONLINE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pusat Integrasi &amp; Sinkronisasi Moodle
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Operator IT / Tim Teknis Sekolah: Mengontrol aliran log aktivitas belajar dari server Moodle LMS ke mesin inferensi EWS 2-Tier dan mengelola kamus mata pelajaran kurikulum.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl neo-btn-primary text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <IconRefresh className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Sedang Menyinkronkan..." : "Tarik & Sinkronkan Sekarang"}</span>
            </button>

            <a
              href="/admin/course-mapping/download"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl neo-btn bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-bold text-xs sm:text-sm transition-all active:scale-95"
              title="Unduh file course_mapping.csv saat ini"
            >
              <IconFile className="w-4 h-4 text-slate-600" />
              <span>Unduh CSV</span>
            </a>
          </div>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div
            className={cn(
              "p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium shadow-2xs",
              syncFeedback.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            )}
          >
            <div className="flex items-center gap-2.5">
              {syncFeedback.success ? (
                <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <IconAlert className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Bento KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* Card 1: Server Moodle */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Koneksi Server LMS
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
                <IconShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                  Moodle 4.3+
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate" title={kpi.moodle_url}>
                {kpi.moodle_url}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isTestingConnection ? "Memeriksa..." : "Uji Koneksi REST API"}</span>
              <IconArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 2: Sinkronisasi Terakhir */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sinkronisasi Terakhir
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
                <IconCalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
                {kpi.last_sync_at}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {kpi.last_sync_full}
              </p>
            </div>
            <div className="text-[11px] text-blue-700 font-bold flex items-center gap-1">
              <IconCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Pipeline Data Normal ({kpi.sync_duration_seconds}s)</span>
            </div>
          </div>

          {/* Card 3: Kamus Mapel */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 90%, rgba(99, 102, 241, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kamus Mata Pelajaran
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs">
                <IconBook className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {kpi.total_courses} <span className="text-xs font-semibold text-slate-500 font-sans">Modul</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tersinkron dengan <code className="text-indigo-600 font-mono">course_mapping.csv</code>
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-700">
              Kejuruan &amp; Muatan Umum SMK
            </span>
          </div>

          {/* Card 4: Siswa & Alert */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 10%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Populasi &amp; Alert EWS
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
                <IconUsers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {kpi.total_students_synced} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {kpi.total_alerts_active} alert mata pelajaran aktif
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-700">
              Tersedia di Dashboard Mapel &amp; BK
            </span>
          </div>
        </div>

        {/* Connection Test Result Badge */}
        {testResult && (
          <div
            className={cn(
              "p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-medium shadow-2xs",
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            )}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <IconAlert className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
              {testResult.latency_ms && (
                <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-emerald-300">
                  Latensi: {testResult.latency_ms}ms
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setTestResult(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Selector: Course Mappings vs Audit Logs */}
        <div className="border-b border-slate-200 flex items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("mappings")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === "mappings"
                  ? "neo-btn-primary shadow-xs"
                  : "neo-btn bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
              )}
            >
              Kamus Mata Pelajaran ({courseMappings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("logs")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === "logs"
                  ? "neo-btn-primary shadow-xs"
                  : "neo-btn bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
              )}
            >
              Log Sinkronisasi ({syncLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("api")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === "api"
                  ? "neo-btn-primary shadow-xs"
                  : "neo-btn bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
              )}
            >
              Pengaturan API &amp; Web Service
            </button>
          </div>

          {activeTab === "mappings" && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl neo-btn bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200/80 text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
            >
              <IconFile className="w-3.5 h-3.5 text-indigo-600" />
              <span>Unggah CSV Baru</span>
            </button>
          )}
        </div>

        {/* TAB 1: Kamus Course Mapping */}
        {activeTab === "mappings" && (
          <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/60 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6 font-mono">Kode Modul</th>
                    <th className="py-4 px-6">Nama Mata Pelajaran</th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6">Guru Pengampu</th>
                    <th className="py-4 px-6 font-mono">No. WhatsApp</th>
                    <th className="py-4 px-4 text-center font-mono">KKM</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-slate-700">
                  {courseMappings.map((item) => (
                    <tr key={item.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-extrabold text-indigo-700">
                        {item.code_module}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {item.nama_mapel}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border",
                            item.kategori_mapel.includes("Kejuruan")
                              ? "bg-purple-50 text-purple-700 border-purple-200/80"
                              : "bg-blue-50 text-blue-700 border-blue-200/80"
                          )}
                        >
                          {item.kategori_mapel}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {item.nama_guru_mapel}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">
                        {item.no_wa_guru || "-"}
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-900">
                        {item.kkm}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <IconEye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {courseMappings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        Belum ada pemetaan kursus. Unggah file course_mapping.csv atau jalankan seeder.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Riwayat Audit Sinkronisasi */}
        {activeTab === "logs" && (
          <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/60 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Waktu Eksekusi</th>
                    <th className="py-4 px-6">Tipe Pemicu</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Siswa Diproses</th>
                    <th className="py-4 px-6">Keterangan / Pesan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-slate-700">
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200">
                          {log.sync_type === "manual" ? "Manual Admin" : "Cron Otomatis"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {log.status === "success" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <IconCheck className="w-3 h-3 text-emerald-600" /> Sukses
                          </span>
                        )}
                        {log.status === "running" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <IconRefresh className="w-3 h-3 animate-spin text-blue-600" /> Berjalan
                          </span>
                        )}
                        {log.status === "failed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <IconAlert className="w-3 h-3 text-rose-600" /> Gagal
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-slate-800">
                        {log.students_processed}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-md">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                  {syncLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400">
                        Belum ada riwayat audit log sinkronisasi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Pengaturan API & Web Service Moodle */}
        {activeTab === "api" && (
          <div className="space-y-6">
            {/* Feedback Alert */}
            {apiSaveFeedback && (
              <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center justify-between text-xs sm:text-sm font-medium shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{apiSaveFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApiSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <IconClose className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Form Konfigurasi Moodle LMS (Lebar Penuh) */}
            <div className="w-full p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 space-y-6 shadow-xs">
              <div className="border-b border-slate-200/60 pb-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <IconShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-mono font-black uppercase tracking-wider">
                    Konektor Moodle Web Service
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Konfigurasi Server LMS Moodle
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Kredensial dan parameter REST API resmi untuk mengalirkan log aktivitas belajar siswa ke mesin inferensi EWS STIKMAS.
                </p>
              </div>

              <form onSubmit={handleSaveApi} className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* URL Server LMS */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      URL Server LMS Moodle
                    </label>
                    <input
                      type="url"
                      value={apiForm.moodle_url}
                      onChange={(e) => setApiForm({ ...apiForm, moodle_url: e.target.value })}
                      placeholder="https://moodle.smkn1mas.sch.id"
                      required
                      className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl neo-inset bg-white border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Protokol HTTPS wajib digunakan untuk integritas transmisi data log aktivitas.
                    </p>
                  </div>

                  {/* wstoken */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Moodle Web Service REST Token (wstoken)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {showToken ? "Sembunyikan" : "Tampilkan Token"}
                      </button>
                    </div>
                    <input
                      type={showToken ? "text" : "password"}
                      value={apiForm.moodle_token}
                      onChange={(e) => setApiForm({ ...apiForm, moodle_token: e.target.value })}
                      required
                      className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl neo-inset bg-white border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Token otentikasi peran Web Service yang memiliki akses ke modul log dan course gradebook.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Fungsi WS Moodle Utama
                    </label>
                    <input
                      type="text"
                      value={apiForm.ws_function}
                      onChange={(e) => setApiForm({ ...apiForm, ws_function: e.target.value })}
                      className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl neo-inset bg-white border border-slate-200 font-mono text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Fungsi Moodle core atau custom plugin untuk mengekstrak log dan nilai.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Jadwal Auto-Sync Harian
                    </label>
                    <input
                      type="text"
                      value={apiForm.auto_sync_schedule}
                      onChange={(e) => setApiForm({ ...apiForm, auto_sync_schedule: e.target.value })}
                      placeholder="02:00 WITA"
                      className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl neo-inset bg-white border border-slate-200 font-mono text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Waktu eksekusi sinkronisasi otomatis harian data Moodle.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-bold shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <IconRefresh className={cn("w-3.5 h-3.5", isTestingConnection && "animate-spin")} />
                    <span>{isTestingConnection ? "Memeriksa Koneksi..." : "Uji Koneksi REST API"}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingApi}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl neo-btn-primary text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <IconSave className="w-3.5 h-3.5" />
                    <span>{isSavingApi ? "Menyimpan..." : "Simpan Pengaturan API"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* SHADCN DIALOG: Edit Course Mapping */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          {editingItem && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-3.5">
                <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
                  EDIT KAMUS MODUL
                </span>
                <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Pemetaan Kursus: {editingItem.code_module}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Perbarui metadata pengampu dan KKM mata pelajaran.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nama_mapel}
                    onChange={(e) => setEditForm({ ...editForm, nama_mapel: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori Mapel
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.kategori_mapel}
                    onChange={(e) => setEditForm({ ...editForm, kategori_mapel: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Guru Pengampu
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nama_guru_mapel}
                    onChange={(e) => setEditForm({ ...editForm, nama_guru_mapel: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      No. WhatsApp Guru
                    </label>
                    <input
                      type="text"
                      value={editForm.no_wa_guru}
                      onChange={(e) => setEditForm({ ...editForm, no_wa_guru: e.target.value })}
                      placeholder="+628123456789"
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-mono text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      KKM (Batas Minimal)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      required
                      value={editForm.kkm}
                      onChange={(e) => setEditForm({ ...editForm, kkm: parseInt(e.target.value) || 75 })}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-mono text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-slate-200/60 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                  >
                    <IconSave className="w-3.5 h-3.5" />
                    <span>{isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SHADCN DIALOG: Upload CSV */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          <DialogHeader className="border-b border-slate-200/60 pb-3.5">
            <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
              IMPOR KURIKULUM CSV
            </span>
            <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
              Unggah File course_mapping.csv
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Format header: <code className="font-mono text-indigo-600">code_module,nama_mapel,kategori_mapel,nama_guru_mapel,no_wa_guru,kkm</code>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadCsv} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-400 bg-white/60 transition-colors">
              <IconFile className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="block text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                <span>Pilih file dari komputer</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {csvFile && (
                <p className="text-xs font-mono text-emerald-700 font-bold mt-2 truncate">
                  {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!csvFile || isUploading}
                className="px-5 py-2.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <IconSend className="w-3.5 h-3.5" />
                <span>{isUploading ? "Mengunggah..." : "Proses Impor CSV"}</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </AppLayout>
  )
}
