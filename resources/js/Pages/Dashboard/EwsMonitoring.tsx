import * as React from "react"
import { Link, router } from "@inertiajs/react"
import { AppLayout, type UserRole } from "@/Layouts/AppLayout"
import {
  IconSearch,
  IconFilter,
  IconArrowLeft,
  IconEye,
  IconSend,
  IconCheck,
  IconAlert,
  IconExclamation,
  IconHandshake,
  IconBook,
  IconUserCheck,
} from "@/components/ui/storage-icon"
import { Button } from "@/components/ui/button"
import { EwsDetailModal, type EwsNotificationDetail } from "@/components/ews/EwsDetailModal"
import { cn } from "@/lib/utils"

export interface ClassBreakdownItem {
  id: number
  name: string
  grade_level: number
  homeroom_teacher: string
  total_at_risk: number
  tinggi_count: number
  sedang_count: number
  rendah_count: number
  intervened_count: number
  coverage_percent: number
}

interface EwsMonitoringProps {
  ewsNotifications?: {
    data: EwsNotificationDetail[]
    links: any[]
    current_page: number
    last_page: number
    total: number
  }
  notifications?: {
    data: EwsNotificationDetail[]
    links: any[]
    current_page: number
    last_page: number
    total: number
  }
  stats: {
    total: number
    tinggi_count: number
    sedang_count: number
    rendah_count: number
    wa_sent_count: number
    pending_count: number
    intervened_count?: number
    unhandled_count?: number
    tinggi_unhandled_count?: number
    coverage_rate?: number
    tinggi_coverage_rate?: number
  }
  classes: Array<{
    id: number
    name: string
    grade_level: number
  }>
  classBreakdown?: ClassBreakdownItem[]
  homeroomClass: {
    id: number
    name: string
    grade_level: number
  } | null
  userRole: UserRole
  filters: {
    risk_level: string
    status: string
    search: string
    class_id: string
  }
}

export default function EwsMonitoring({
  ewsNotifications,
  notifications: legacyNotifications,
  stats,
  classes = [],
  classBreakdown = [],
  homeroomClass,
  userRole = "guru_bk",
  filters,
}: EwsMonitoringProps) {
  const records = ewsNotifications || legacyNotifications || {
    data: [],
    links: [],
    current_page: 1,
    last_page: 1,
    total: 0,
  }
  const [selectedNotification, setSelectedNotification] = React.useState<EwsNotificationDetail | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)

  // Local state for filters
  const [search, setSearch] = React.useState(filters.search || "")
  const [selectedLevel, setSelectedLevel] = React.useState(filters.risk_level || "ALL")
  const [selectedStatus, setSelectedStatus] = React.useState(filters.status || "ALL")
  const [selectedClass, setSelectedClass] = React.useState(filters.class_id || "ALL")

  const isKepsek = userRole === "kepsek"
  const isWaliKelas = userRole === "guru_kelas"
  const isBk = !isKepsek && !isWaliKelas

  const dashboardBackUrl = isKepsek
    ? "/kepsek/dashboard"
    : isWaliKelas
    ? "/guru-kelas/dashboard"
    : "/guru-bk/dashboard"

  const applyFilters = (newParams: Record<string, string>) => {
    const currentParams = {
      search,
      risk_level: selectedLevel,
      status: selectedStatus,
      class_id: selectedClass,
      ...newParams,
    }

    // Clean up 'ALL' or empty values
    const query: Record<string, string> = {}
    if (currentParams.search) query.search = currentParams.search
    if (currentParams.risk_level && currentParams.risk_level !== "ALL") query.risk_level = currentParams.risk_level
    if (currentParams.status && currentParams.status !== "ALL") query.status = currentParams.status
    if (currentParams.class_id && currentParams.class_id !== "ALL") query.class_id = currentParams.class_id

    router.get("/ews", query, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ search })
  }

  const handleLevelTab = (level: string) => {
    setSelectedLevel(level)
    applyFilters({ risk_level: level })
  }

  const handleOpenDetail = (item: EwsNotificationDetail) => {
    setSelectedNotification(item)
    setIsDetailModalOpen(true)
  }

  const pageTitle = isKepsek
    ? "Radar EWS Eksekutif • Pengawasan Terpadu Seluruh Sekolah"
    : isWaliKelas
    ? `Radar EWS Pembelajaran • Kelas ${homeroomClass?.name || "Binaan"}`
    : "Radar EWS Bimbingan Konseling • Triage & Intervensi Klinis"

  const pageSubtitle = isKepsek
    ? "Pusat pengawasan makro risiko siswa, kepatuhan tindak lanjut konseling BK/Wali Kelas, dan deteksi dini Moodle ML"
    : isWaliKelas
    ? `Pemantauan risiko akademik & keterlibatan belajar siswa kelas ${homeroomClass?.name || ""} berbasis analisis log Moodle`
    : "Deteksi dini risiko kegagalan studi & disengagement siswa berbasis kebiasaan belajar di LMS Moodle"

  return (
    <AppLayout
      currentRole={userRole}
      activeMenu="ews_monitoring"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      {/* Top Action Bar with Breadcrumb / Shortcut */}
      <div className="p-4 sm:p-5 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 flex flex-wrap items-center justify-between gap-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]">
        <div className="flex items-center gap-3">
          <Link
            href={dashboardBackUrl}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-slate-300 flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs transition-all active:scale-95"
            title="Kembali ke Dashboard"
          >
            <IconArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {isKepsek
                  ? "Ruang Pengawasan Eksekutif Kepala Sekolah"
                  : isWaliKelas
                  ? `Ruang Pantau Wali Kelas (${homeroomClass?.name || "-"})`
                  : "Pusat Triage EWS Bimbingan Konseling"}
              </span>
              <span className="px-2.5 py-0.5 rounded-xl text-xs font-bold bg-white text-indigo-800 border border-slate-200/80 shadow-2xs">
                Moodle ML AI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Semester Ganjil 2026/2027 • Model Prediksi RandomForest (Cut-off Hari ke-60)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Bot Notifier Siap</span>
          </div>
        </div>
      </div>

      {/* Bento Stat Cards Standard (AGENTS.md with Ambient Silhouette Glow) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total Monitored */}
        <div className="p-6 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] flex flex-col justify-between min-h-[155px] space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/6 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {isKepsek ? "Indeks Risiko Sekolah" : isWaliKelas ? "Siswa Berisiko di Kelas" : "Total Siswa Berisiko"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs">
              <IconBook className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 tracking-tight block">
              {stats.total}
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              {isKepsek ? "Siswa terdeteksi risiko Moodle ML di sekolah" : isWaliKelas ? `Populasi kelas ${homeroomClass?.name || ""}` : "Seluruh siswa terdaftar di LMS"}
            </span>
          </div>
        </div>

        {/* Card 2: High Risk */}
        <div className="p-6 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] flex flex-col justify-between min-h-[155px] space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/7 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500">
              {isKepsek ? "Kasus Kritis Butuh Atensi" : isWaliKelas ? "Butuh Pendampingan Cepat" : "Prioritas Kritis (Urgent)"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-2xs">
              <IconExclamation className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-extrabold text-rose-600 tracking-tight">
                {stats.tinggi_count}
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/80">
                {isKepsek ? `${stats.tinggi_unhandled_count ?? 0} Belum Ditangani` : isWaliKelas ? "Prioritas Kelas" : "Panggilan / Tindak Lanjut"}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              Probabilitas kegagalan &ge; 70%
            </span>
          </div>
        </div>

        {/* Card 3: Contextual Action Metric */}
        <div className="p-6 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] flex flex-col justify-between min-h-[155px] space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/7 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">
              {isKepsek ? "Tingkat Penanganan" : isWaliKelas ? "Sudah Didampingi" : "Risiko Sedang (Waspada)"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
              <IconAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-extrabold text-amber-600 tracking-tight">
                {isKepsek ? `${stats.coverage_rate ?? 0}%` : isWaliKelas ? (stats.intervened_count ?? 0) : stats.sedang_count}
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                {isKepsek
                  ? `${stats.intervened_count ?? 0}/${stats.total} Selesai`
                  : isWaliKelas
                  ? `${stats.unhandled_count ?? 0} Menunggu`
                  : "Konfirmasi Santai"}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              {isKepsek ? "Kepatuhan tindak lanjut staf BK & Wali Kelas" : isWaliKelas ? "Catatan bimbingan kelas tersimpan" : "Probabilitas 40% - 69%"}
            </span>
          </div>
        </div>

        {/* Card 4: WA Notification Delivery */}
        <div className="p-6 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] flex flex-col justify-between min-h-[155px] space-y-4 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-36 h-36 bg-emerald-500/7 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              Peringatan WhatsApp
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
              <IconSend className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-600 tracking-tight">
                {stats.wa_sent_count}
              </span>
              <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                {stats.pending_count} Antrean
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              {isKepsek ? "Kepatuhan notifikasi sampai ke orang tua" : "Peringatan terkirim ke wali murid"}
            </span>
          </div>
        </div>
      </div>

      {/* Peta Risiko Siswa per Rombel Kelas (Khusus Kepala Sekolah - Master Admin) */}
      {isKepsek && classBreakdown && classBreakdown.length > 0 && (
        <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 p-5 sm:p-6 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Distribusi Risiko Belajar per Rombel Kelas (Executive Overview)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik salah satu rombel kelas untuk memfilter daftar siswa dan memantau progres penanganan secara spesifik.
              </p>
            </div>
            {selectedClass !== "ALL" && (
              <button
                type="button"
                onClick={() => { setSelectedClass("ALL"); applyFilters({ class_id: "ALL" }); }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-blue-600 hover:text-blue-800 shadow-2xs cursor-pointer transition-all"
              >
                Tampilkan Semua Kelas
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {classBreakdown.map((c) => {
              const isSelected = selectedClass === String(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    const nextClass = isSelected ? "ALL" : String(c.id)
                    setSelectedClass(nextClass)
                    applyFilters({ class_id: nextClass })
                  }}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden",
                    isSelected
                      ? "bg-white border-blue-500 shadow-sm ring-2 ring-blue-400/20"
                      : "bg-white/80 hover:bg-white border-slate-200/80 shadow-2xs hover:shadow-xs"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">{c.name}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                        Wali: {c.homeroom_teacher}
                      </span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-xs font-mono font-bold",
                      c.tinggi_count > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-700"
                    )}>
                      {c.total_at_risk} Berisiko
                    </span>
                  </div>

                  {/* Badges distribution */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[10px] font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      T: {c.tinggi_count}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      S: {c.sedang_count}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      R: {c.rendah_count}
                    </span>
                    <span className="ml-auto text-slate-400 font-medium">
                      {c.intervened_count}/{c.total_at_risk} Selesai
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Risk Level Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Semua Siswa" },
            { id: "TINGGI", label: "Risiko Tinggi", count: stats.tinggi_count, badgeColor: "bg-rose-100 text-rose-700" },
            { id: "SEDANG", label: "Risiko Sedang", count: stats.sedang_count, badgeColor: "bg-amber-100 text-amber-700" },
            { id: "RENDAH", label: "Aman / Rendah", count: stats.rendah_count, badgeColor: "bg-emerald-100 text-emerald-700" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleLevelTab(tab.id)}
              className={cn(
                "px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                selectedLevel === tab.id
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/90"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn("px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold", tab.badgeColor || "bg-slate-100 text-slate-600")}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Search & Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          
          {/* Class Filter (Only active for Guru BK or Kepsek) */}
          {!isWaliKelas && classes.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                applyFilters({ class_id: e.target.value })
              }}
              className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="ALL">Semua Rombel Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Status WA Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              applyFilters({ status: e.target.value })
            }}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="ALL">Semua Status WA</option>
            <option value="sent">WhatsApp Terkirim</option>
            <option value="ready">Siap Kirim</option>
            <option value="pending">Antrean Pending</option>
          </select>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa / Moodle ID..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </form>
        </div>
      </div>

      {/* Main Table: Siswa Berisiko EWS */}
      <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] overflow-hidden">
        <div className="p-5 sm:p-6 bg-white/70 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {isKepsek
                ? "Daftar Siswa Berisiko Seluruh Sekolah (Supervisi Eksekutif)"
                : isWaliKelas
                ? `Daftar Siswa Berisiko di Kelas ${homeroomClass?.name || "Binaan"}`
                : "Daftar Siswa Berisiko Terdeteksi Model LMS (Triage Klinis BK)"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {records.data.length} dari total {records.total} catatan deteksi aktif
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-100/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Siswa &amp; Kelas</th>
                <th className="py-3.5 px-4">Mata Pelajaran LMS</th>
                <th className="py-3.5 px-4">Tingkat Risiko &amp; Skor</th>
                <th className="py-3.5 px-4">Indikator Cepat Belajar</th>
                <th className="py-3.5 px-4">{isKepsek ? "Status Penanganan" : "Status WA"}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">
                  {isKepsek ? "Aksi Supervisi" : isWaliKelas ? "Aksi Wali Kelas" : "Aksi Intervensi"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs text-slate-800">
              {records.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <IconAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada catatan siswa berisiko yang cocok dengan filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah tab kategori.</p>
                  </td>
                </tr>
              ) : (
                records.data.map((item) => {
                  const m = item.moodle_metrics || {}
                  const riskStyle = {
                    TINGGI: "bg-rose-50 text-rose-700 border-rose-200/80",
                    SEDANG: "bg-amber-50 text-amber-700 border-amber-200/80",
                    RENDAH: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
                  }[item.risk_level] || "bg-slate-50 text-slate-700 border-slate-200"

                  return (
                    <tr key={item.id} className="hover:bg-white/60 transition-colors">
                      {/* Siswa & Kelas */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-extrabold text-slate-700 text-xs shadow-2xs shrink-0">
                            {item.student_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {item.student_name}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5 inline-block">
                              {item.class_name || "Kelas Siswa"} • ID Moodle: <strong className="font-mono text-slate-700">{item.moodle_student_id}</strong>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Mapel */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {item.course_code}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.academic_period}
                        </span>
                      </td>

                      {/* Level Risiko */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2.5 py-1 rounded-xl text-xs font-bold border", riskStyle)}>
                            {item.risk_level}
                          </span>
                          <span className="font-mono font-bold text-slate-700">
                            {item.risk_percentage}
                          </span>
                        </div>
                        {item.intervention_urgency && (
                          <span className="text-[10px] text-slate-500 line-clamp-1 mt-1 max-w-[220px]">
                            {item.intervention_urgency}
                          </span>
                        )}
                      </td>

                      {/* Indikator Cepat Moodle */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div title="Hari Tidak Aktif">
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">Inaktif</span>
                            <span className={cn("font-mono font-bold", (m.days_inactive ?? 0) >= 14 ? "text-rose-600" : "text-slate-700")}>
                              {m.days_inactive ?? 0} hr
                            </span>
                          </div>
                          <div title="Tugas Belum Dikumpulkan">
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">Tugas Kurang</span>
                            <span className={cn("font-mono font-bold", (m.missing_assignments ?? 0) > 0 ? "text-rose-600" : "text-slate-700")}>
                              {m.missing_assignments ?? 0}
                            </span>
                          </div>
                          <div title="Total Klik Materi">
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">Akses</span>
                            <span className="font-mono font-bold text-slate-700">
                              {m.total_clicks ?? 0}x
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Penanganan & WA */}
                      <td className="py-4 px-4">
                        {isKepsek ? (
                          <div className="space-y-1">
                            {item.interventions && item.interventions.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <IconCheck className="w-3 h-3 text-blue-600" />
                                <span>{item.interventions.length}x Ditindaklanjuti</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <IconAlert className="w-3 h-3 text-amber-600" />
                                <span>Menunggu Tindak Lanjut</span>
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 block font-medium">
                              WA: {item.status === "sent" ? "Tersalurkan" : "Antrean"}
                            </span>
                          </div>
                        ) : item.status === "sent" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <IconCheck className="w-3 h-3 text-emerald-600" />
                            <span>Terkirim WA</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <IconSend className="w-3 h-3 text-slate-400" />
                            <span>Siap Kirim</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(item)}
                          className={cn(
                            "h-8 px-3 rounded-xl text-xs font-bold shadow-2xs transition-all",
                            isKepsek
                              ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-900 hover:text-white"
                              : isWaliKelas
                              ? "bg-white hover:bg-slate-50 border-slate-200/90 text-blue-700 hover:text-blue-800"
                              : "bg-white hover:bg-slate-50 border-slate-200/90 text-indigo-700 hover:text-indigo-800"
                          )}
                        >
                          {isKepsek ? (
                            <>
                              <IconEye className="w-3.5 h-3.5 mr-1" />
                              <span>Review &amp; Supervisi</span>
                            </>
                          ) : isWaliKelas ? (
                            <>
                              <IconUserCheck className="w-3.5 h-3.5 mr-1" />
                              <span>Bimbingan / Rujuk</span>
                            </>
                          ) : (
                            <>
                              <IconHandshake className="w-3.5 h-3.5 mr-1" />
                              <span>Analisis &amp; Intervensi</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records.last_page > 1 && (
          <div className="p-4 sm:p-5 bg-white/70 border-t border-slate-200/80 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Halaman {records.current_page} dari {records.last_page}
            </span>
            <div className="flex items-center gap-1.5">
              {records.links.map((link, idx) => {
                if (!link.url) {
                  return (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs text-slate-400 font-semibold"
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  )
                }
                return (
                  <Link
                    key={idx}
                    href={link.url}
                    preserveScroll
                    preserveState
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold transition-all",
                      link.active
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail & Form Intervensi */}
      <EwsDetailModal
        notification={selectedNotification}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        userRole={userRole}
      />
    </AppLayout>
  )
}
