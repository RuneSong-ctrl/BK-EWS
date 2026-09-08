import * as React from "react"
import { AppLayout } from "@/Layouts/AppLayout"
import { router } from "@inertiajs/react"
import {
  IconAlert,
  IconAlertSign,
  IconCheck,
  IconCheckCircle,
  IconEye,
  IconBook,
  IconSpreadsheet,
  IconTrendUp,
  IconAi,
  IconClose,
  IconSave,
  IconChevronRight,
  IconFilter,
  IconUser,
  IconUsers,
  IconArrowLeft,
  IconArrowRight,
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

interface CourseItem {
  id: number
  code_module: string
  nama_mapel: string
  kategori_mapel: string
  nama_guru_mapel: string
  no_wa_guru?: string
  kkm: number
}

interface AlertItem {
  id: number
  siswa_id: number
  kode_modul: string
  nama_mapel: string
  kategori_mapel: string
  guru_pengampu: string
  kkm: number
  tingkat_risiko: "TINGGI" | "SEDANG" | "RENDAH"
  probabilitas_risiko: number
  durasi_belajar_jam: number
  lesson_attempts: number
  rasio_ketuntasan_lesson: number
  nilai_rata_rata_lesson: number
  tugas_belum_dikumpul: number
  tugas_terlambat: number
  nilai_rata_rata_tugas: number
  metrik_24_fitur_model: {
    engagement_dan_durasi?: {
      total_clicks?: number
      active_days?: number
      days_inactive?: number
      is_inactive_gt_5d?: number
      is_inactive_gt_14d?: number
      unique_sites_accessed?: number
      forum_clicks?: number
      homepage_clicks?: number
      course_duration_hours?: number
    }
    kepatuhan_tugas?: {
      missing_assignments?: number
      late_submission_count?: number
      avg_submission_gap?: number
      procrastination_count?: number
    }
    aktivitas_lesson?: {
      lesson_attempts_count?: number
      lesson_completion_ratio?: number
      lesson_avg_score?: number
      lesson_time_spent_min?: number
    }
    akademik?: {
      avg_score?: number
      min_score?: number
      max_score?: number
      score_rel_to_module?: number
      failing_tasks_count?: number
    }
    konteks_siswa?: {
      studied_credits?: number
      num_of_prev_attempts?: number
    }
  }
  faktor_pemicu?: string[]
  rekomendasi_tindakan: string
  status: "pending" | "konfirmasi_tugas" | "remedial" | "selesai"
  catatan_guru_mapel?: string
  student?: {
    id: number
    nis: string
    nisn: string
    name: string
  }
}

interface GuruKelasProps {
  courses?: CourseItem[]
  activeCourse?: CourseItem
  selectedModule?: string
  courseAlerts?: AlertItem[]
  stats?: {
    total_students: number
    high_risk_count: number
    medium_risk_count: number
    low_risk_count: number
    avg_duration_hours: number
    total_missing_tasks: number
    handled_count: number
  }
  teacherName?: string
}

interface DOMAIN_SLIDE_ITEM {
  key: "engagement" | "tugas" | "lesson" | "akademik" | "konteks"
  number: number
  title: string
  shortTitle: string
  count: number
  description: string
}

const DOMAIN_SLIDES: DOMAIN_SLIDE_ITEM[] = [
  {
    key: "engagement",
    number: 1,
    title: "Keaktifan & Durasi Belajar",
    shortTitle: "Keaktifan & Durasi",
    count: 9,
    description: "Evaluasi intensitas klik, hari aktif/inaktif, dan akumulasi jam belajar pada modul ini di LMS Moodle.",
  },
  {
    key: "tugas",
    number: 2,
    title: "Kepatuhan Tugas & Asesmen",
    shortTitle: "Kepatuhan Tugas",
    count: 4,
    description: "Monitoring keterlambatan pengumpulan, tugas belum diserahkan, dan prokrastinasi menjelang deadline.",
  },
  {
    key: "lesson",
    number: 3,
    title: "Aktivitas Interaktif Lesson",
    shortTitle: "Aktivitas Lesson",
    count: 4,
    description: "Tingkat penuntasan materi interaktif, jumlah percobaan berulang, dan pemahaman konsep modul lesson.",
  },
  {
    key: "akademik",
    number: 4,
    title: "Performa & Historis Akademik",
    shortTitle: "Performa Akademik",
    count: 5,
    description: "Analisis nilai rata-rata tugas asesmen, nilai terendah, deviasi kelas, dan pemenuhan standar KKM.",
  },
  {
    key: "konteks",
    number: 5,
    title: "Konteks Siswa & Beban Belajar",
    shortTitle: "Konteks Siswa",
    count: 2,
    description: "Riwayat pengulangan modul pada semester lampau dan total beban jam pembelajaran terdaftar.",
  },
]

export default function GuruKelas({
  activeCourse,
  courses = [],
  courseAlerts = [],
  selectedModule = "AAA",
  stats = {
    total_students: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    avg_duration_hours: 0,
    total_missing_tasks: 0,
    handled_count: 0,
  },
  teacherName,
}: GuruKelasProps) {
  const [selectedAlert, setSelectedAlert] = React.useState<AlertItem | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState<number>(0)

  // Modal Action State
  const [actionModalAlert, setActionModalAlert] = React.useState<AlertItem | null>(null)
  const [actionStatus, setActionStatus] = React.useState<"pending" | "konfirmasi_tugas" | "remedial" | "selesai">("konfirmasi_tugas")
  const [actionNotes, setActionNotes] = React.useState("")
  const [isSubmittingAction, setIsSubmittingAction] = React.useState(false)

  // Filter Bar State
  const [riskFilter, setRiskFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  const handleModuleChange = (codeModule: string) => {
    router.get(
      "/guru-kelas/dashboard",
      { module: codeModule },
      { preserveState: true, preserveScroll: true }
    )
  }

  const openActionModal = (alert: AlertItem) => {
    setActionModalAlert(alert)
    setActionStatus(alert.status || "konfirmasi_tugas")
    setActionNotes(alert.catatan_guru_mapel || "")
  }

  const submitAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionModalAlert) return

    setIsSubmittingAction(true)
    router.patch(
      `/guru-kelas/alerts/${actionModalAlert.id}/status`,
      {
        status: actionStatus,
        catatan_guru_mapel: actionNotes,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSubmittingAction(false)
          setActionModalAlert(null)
        },
        onError: () => {
          setIsSubmittingAction(false)
        },
        onFinish: () => {
          setIsSubmittingAction(false)
        },
      }
    )
  }

  // Filtered Alerts
  const filteredAlerts = React.useMemo(() => {
    return (Array.isArray(courseAlerts) ? courseAlerts : []).filter((alert) => {
      if (riskFilter !== "ALL" && alert.tingkat_risiko !== riskFilter) {
        return false
      }
      if (statusFilter !== "ALL" && alert.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        const nameMatch = (alert.student?.name || "").toLowerCase().includes(q)
        const nisMatch = (alert.student?.nis || "").toLowerCase().includes(q)
        if (!nameMatch && !nisMatch) return false
      }
      return true
    })
  }, [courseAlerts, riskFilter, statusFilter, searchQuery])

  return (
    <AppLayout
      currentRole="guru_kelas"
      activeMenu="dashboard"
      title="Guru Mata Pelajaran — Tier 1 Deteksi Belajar"
      subtitle="Monitoring kepatuhan belajar, lesson interaktif, dan asesmen tugas per mata pelajaran Moodle"
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-8">
        
        {/* Top Header Card: Course Identity & Course Switcher */}
        <div className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                  TIER 1 &bull; GURU MATA PELAJARAN
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Pengampu: {teacherName || activeCourse?.nama_guru_mapel || "Pendidik Terdaftar"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeCourse?.nama_mapel || "Pemrograman Web dan Perangkat Bergerak"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                Evaluasi otomatis performa belajar siswa pada mata pelajaran ini berdasarkan model Machine Learning 24 fitur (durasi jam belajar, aktivitas interaktif Lesson, kepatuhan tugas asesmen, dan historis nilai LMS Moodle).
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 bg-white/80 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="px-3 py-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                KKM: <span className="font-mono text-slate-900 font-extrabold text-sm">{activeCourse?.kkm || 75}</span>
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <div className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/60 rounded-xl border border-indigo-200/60 font-mono">
                {activeCourse?.code_module || selectedModule} &bull; {activeCourse?.kategori_mapel || "Kejuruan"}
              </div>
            </div>
          </div>
        </div>

        {/* Pilihan Mata Pelajaran: Responsif Card Grid (Tanpa Horizontal Scroll) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBook className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Pilih Mata Pelajaran Terpantau ({courses.length} Mapel)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Klik kartu mapel untuk berganti pantauan modul Moodle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
            {(Array.isArray(courses) ? courses : []).map((course) => {
              const isActive = selectedModule === course.code_module
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleModuleChange(course.code_module)}
                  className={cn(
                    "p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex items-center justify-between gap-3 group",
                    isActive
                      ? "bg-white border-2 border-indigo-600 shadow-md ring-4 ring-indigo-500/10"
                      : "bg-white/80 hover:bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Compact Code Badge */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors shadow-2xs",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 border border-slate-200/70"
                      )}
                    >
                      {course.code_module}
                    </div>

                    {/* Course Details */}
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          "text-xs sm:text-sm font-bold truncate transition-colors leading-tight",
                          isActive ? "text-slate-900 font-extrabold" : "text-slate-700 group-hover:text-indigo-600"
                        )}
                        title={course.nama_mapel}
                      >
                        {course.nama_mapel}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                        <span className="truncate max-w-[100px]">{course.kategori_mapel || "Kejuruan"}</span>
                        <span>&bull;</span>
                        <span className="font-mono font-bold text-slate-600">KKM {course.kkm || 75}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Indicator / Selection Affordance */}
                  <div className="shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                        <IconCheck className="w-3 h-3 text-indigo-600" />
                        <span className="hidden sm:inline">Dipantau</span>
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-lg bg-slate-100/80 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <IconChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4 Bento KPI Cards (Neumorphic with Varied Ambient Silhouette Glow) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* Card 1: Risiko Tinggi */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 10%, rgba(225, 29, 72, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Risiko Tinggi (Merah)
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-2xs">
                <IconAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-rose-600 font-mono tracking-tight">
                {stats.high_risk_count} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Probabilitas kegagalan &ge; 70% di LMS Moodle
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Prioritas intervensi &amp; konfirmasi</span>
            </div>
          </div>

          {/* Card 2: Durasi Belajar Rata-rata */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rata-rata Waktu Belajar
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
                <IconTrendUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {stats.avg_duration_hours} <span className="text-xs font-semibold text-slate-500 font-sans">Jam</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Akumulasi durasi interaksi materi modul
              </p>
            </div>
            <div className="text-[11px] font-bold text-blue-700">
              Standar minimum: 12 jam/semester
            </div>
          </div>

          {/* Card 3: Tugas Belum Dikumpul */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 90%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tugas Belum Dikumpul
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
                <IconSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-600 font-mono tracking-tight">
                {stats.total_missing_tasks} <span className="text-xs font-semibold text-slate-500 font-sans">Tugas</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tugas melewati batas deadline tanpa submission
              </p>
            </div>
            <div className="text-[11px] font-bold text-amber-700">
              Perlu konfirmasi tagihan di kelas
            </div>
          </div>

          {/* Card 4: Tertangani */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Telah Ditindaklanjuti
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
                <IconCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
                {stats.handled_count} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Telah diberi catatan, konfirmasi, atau remedial
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-700">
              {stats.total_students > 0
                ? `${Math.round((stats.handled_count / stats.total_students) * 100)}% progress respon guru`
                : "100% terkendali"}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 rounded-2xl neo-card bg-[#EEF2F7] border border-white/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <IconFilter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter:</span>
            </span>

            {/* Risk Filter */}
            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              {(["ALL", "TINGGI", "SEDANG", "RENDAH"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setRiskFilter(lvl)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    riskFilter === lvl
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {lvl === "ALL" ? "Semua Risiko" : lvl}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              {(["ALL", "pending", "konfirmasi_tugas", "remedial", "selesai"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize",
                    statusFilter === st
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {st === "ALL" ? "Semua Status" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari siswa atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl neo-inset bg-white border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Main Table: Siswa Terdeteksi Berisiko pada Mata Pelajaran */}
        <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 overflow-hidden shadow-xs">
          <div className="p-6 sm:p-7 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Daftar Siswa Terdeteksi Model EWS Moodle</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {filteredAlerts.length} Siswa
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Data real-time hasil inferensi model ML terhadap log LMS Moodle modul <span className="font-mono font-bold text-slate-700">{selectedModule}</span>.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/60 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Siswa</th>
                  <th className="py-4 px-6 text-center">Tingkat Risiko</th>
                  <th className="py-4 px-4 text-center">Durasi Jam</th>
                  <th className="py-4 px-4 text-center">Lesson Attempts</th>
                  <th className="py-4 px-4 text-center">Tugas Bolong</th>
                  <th className="py-4 px-6">Status Tindakan Guru</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-slate-700">
                {filteredAlerts.map((alert) => {
                  const studentName = alert.student?.name || `Siswa ${alert.siswa_id}`
                  const riskPercentage = Math.round(alert.probabilitas_risiko * 100)

                  return (
                    <tr key={alert.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(alert)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            <span>{studentName}</span>
                            <IconEye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            NIS: {alert.student?.nis || alert.siswa_id}
                          </span>
                        </button>
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border shadow-2xs whitespace-nowrap",
                            alert.tingkat_risiko === "TINGGI"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : alert.tingkat_risiko === "SEDANG"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          <span>{alert.tingkat_risiko}</span>
                          <span className="font-mono text-[11px] opacity-80">({riskPercentage}%)</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                        {alert.durasi_belajar_jam} jam
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800">
                          {alert.lesson_attempts}x
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Skor: {alert.nilai_rata_rata_lesson}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {alert.tugas_belum_dikumpul > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 font-mono whitespace-nowrap">
                            {alert.tugas_belum_dikumpul} tugas
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-emerald-600 font-bold justify-center gap-1 whitespace-nowrap">
                            <IconCheck className="w-3.5 h-3.5" /> Lengkap
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {alert.status === "pending" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs whitespace-nowrap">
                            Menunggu Respon
                          </span>
                        )}
                        {alert.status === "konfirmasi_tugas" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs whitespace-nowrap">
                            Konfirmasi Tugas
                          </span>
                        )}
                        {alert.status === "remedial" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs whitespace-nowrap">
                            Program Remedial
                          </span>
                        )}
                        {alert.status === "selesai" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
                            <IconCheck className="w-3 h-3 shrink-0" /> Selesai Ditangani
                          </span>
                        )}
                        {alert.catatan_guru_mapel && (
                          <p className="text-[11px] text-slate-500 italic mt-1 truncate max-w-xs" title={alert.catatan_guru_mapel}>
                            &ldquo;{alert.catatan_guru_mapel}&rdquo;
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openActionModal(alert)}
                            className="px-3.5 py-1.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200/80 text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                          >
                            Tindakan
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedAlert(alert)}
                            className="p-2 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs shadow-2xs active:scale-95 cursor-pointer"
                            title="Lihat Rincian 24 Indikator Moodle"
                          >
                            <IconEye className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredAlerts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <IconCheckCircle className="w-8 h-8 text-emerald-500/70" />
                        <span className="font-bold text-sm text-slate-600">Tidak ada siswa berisiko pada filter ini</span>
                        <span className="text-xs text-slate-400">Seluruh siswa aktif terpantau aman dan memenuhi KKM.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SHADCN DIALOG 1: Rincian Diagnosa 24 Fitur AI Moodle */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-5xl 2xl:max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
          {selectedAlert && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    DIAGNOSIS 24 INDIKATOR MOODLE
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Modul: {selectedAlert.kode_modul} &bull; {selectedAlert.nama_mapel}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {selectedAlert.student?.name || `Siswa ${selectedAlert.siswa_id}`}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500">
                  NIS: {selectedAlert.student?.nis || selectedAlert.siswa_id} &bull; Tingkat Risiko:{" "}
                  <span className="font-extrabold text-rose-600">
                    {selectedAlert.tingkat_risiko} ({Math.round(selectedAlert.probabilitas_risiko * 100)}%)
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* Rekomendasi Tindakan AI */}
              <div className="p-5 rounded-2xl neo-card bg-white border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
                  <IconAi className="w-4 h-4" />
                  <span>Rekomendasi Tindakan Guru Mapel</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                  {selectedAlert.rekomendasi_tindakan}
                </p>
                {Array.isArray(selectedAlert.faktor_pemicu) && selectedAlert.faktor_pemicu.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Faktor Pemicu Utama:</span>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 pt-1">
                      {selectedAlert.faktor_pemicu.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Slide Stepper Header (Single Navigation Control in Footer) */}
              <div className="p-5 rounded-2xl neo-card bg-white border border-slate-200/80 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono font-bold text-xs shadow-2xs whitespace-nowrap">
                      Slide {currentSlideIndex + 1} dari {DOMAIN_SLIDES.length}
                    </span>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                      {DOMAIN_SLIDES[currentSlideIndex].title}
                    </h3>
                    <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60 whitespace-nowrap">
                      {DOMAIN_SLIDES[currentSlideIndex].count} Indikator Terukur
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    Pilih tab domain di bawah untuk navigasi langsung
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {DOMAIN_SLIDES[currentSlideIndex].description}
                </p>

                {/* 5-Domain Stepper Tabs (Untruncated, Spacious & Responsive) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                  {DOMAIN_SLIDES.map((slide, idx) => {
                    const isActive = currentSlideIndex === idx
                    return (
                      <button
                        key={slide.key}
                        type="button"
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={cn(
                          "p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 group",
                          isActive
                            ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40"
                            : "bg-[#EEF2F7] hover:bg-white text-slate-700 border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-black font-mono",
                              isActive ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200"
                            )}
                          >
                            Domain {slide.number}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold font-mono",
                              isActive ? "text-indigo-100" : "text-slate-400"
                            )}
                          >
                            {slide.count} Fitur
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-bold leading-snug",
                            isActive ? "text-white font-extrabold" : "text-slate-800 group-hover:text-indigo-600"
                          )}
                        >
                          {slide.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* SLIDE 1: Keaktifan & Durasi (9 Fitur) */}
              {currentSlideIndex === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-3.5">
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Klik Log</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.total_clicks ?? "-"}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Interaksi e-learning</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Hari Aktif Belajar</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.active_days ?? "-"} hari
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Semester aktif</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Hari Inaktif Terakhir</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.days_inactive ?? "-"} hari
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Sejak akses terakhir</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Durasi Jam Belajar</span>
                    <div className="text-xl font-black text-indigo-600 font-mono mt-0.5">
                      {selectedAlert.durasi_belajar_jam} jam
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold">Total durasi materi</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Status Inaktif Kritis</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.is_inactive_gt_14d ? (
                        <span className="text-rose-600 font-bold">Ya (&gt;14 Hari)</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Aman (&le;14 Hari)</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Batas waspada sekolah</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Modul Unik Diakses</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.unique_sites_accessed ?? "-"} modul
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Variasi resource</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Klik Diskusi Forum</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.forum_clicks ?? 0} klik
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Interaksi tanya-jawab</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Klik Beranda Modul</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.homepage_clicks ?? 0} klik
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Akses beranda mapel</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Inaktif &gt; 5 Hari</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {selectedAlert.metrik_24_fitur_model?.engagement_dan_durasi?.is_inactive_gt_5d ? (
                        <span className="text-amber-600 font-bold">Ya</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Tidak</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Early alert 5 hari</span>
                  </div>
                </div>
              )}

              {/* SLIDE 2: Kepatuhan Tugas (4 Fitur) */}
              {currentSlideIndex === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Tugas Belum Dikumpul</span>
                    <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.kepatuhan_tugas?.missing_assignments ?? selectedAlert.tugas_belum_dikumpul} tugas
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Tugas yang melewati batas waktu tanpa berkas submission.</p>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Tugas Terlambat</span>
                    <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.kepatuhan_tugas?.late_submission_count ?? selectedAlert.tugas_terlambat} kali
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Pengumpulan yang melebihi batas due date modul.</p>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Gap Deadline</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.kepatuhan_tugas?.avg_submission_gap ?? 0} hari
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Selisih waktu penyerahan berkas terhadap tenggat tugas.</p>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Submit Menit Terakhir</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.kepatuhan_tugas?.procrastination_count ?? 0} kali
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Pola prokrastinasi pengumpulan &lt; 30 menit sebelum deadline.</p>
                  </div>
                </div>
              )}

              {/* SLIDE 3: Aktivitas Lesson (4 Fitur) */}
              {currentSlideIndex === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Percobaan Lesson</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.lesson_attempts} kali
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Frekuensi pengulangan membaca modul materi bertingkat.</p>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Rasio Ketuntasan Lesson</span>
                    <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
                      {Math.round(selectedAlert.rasio_ketuntasan_lesson * 100)}%
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Persentase halaman interaktif yang telah diselesaikan.</p>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Waktu di Modul Lesson</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.aktivitas_lesson?.lesson_time_spent_min ?? 0} menit
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Akumulasi durasi fokus membaca materi interaktif.</p>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Nilai Pemahaman Lesson</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.nilai_rata_rata_lesson}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Rata-rata skor kuis kecil di akhir tiap bab materi.</p>
                  </div>
                </div>
              )}

              {/* SLIDE 4: Performa Akademik (5 Fitur) */}
              {currentSlideIndex === 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Nilai Rata-rata Tugas</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.akademik?.avg_score ?? selectedAlert.nilai_rata_rata_tugas}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Skor tugas siswa</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Nilai Terendah</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.akademik?.min_score ?? "-"}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Titik terendah asesmen</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Deviasi vs Kelas</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.akademik?.score_rel_to_module ?? "-"}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Posisi relatif modul</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Tugas di Bawah KKM</span>
                    <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.akademik?.failing_tasks_count ?? 0} tugas
                    </div>
                    <span className="text-[10px] text-rose-600 font-bold block mt-1">Butuh remedial</span>
                  </div>
                  <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Standar KKM Modul</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.kkm || 75}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Ambang batas tuntas</span>
                  </div>
                </div>
              )}

              {/* SLIDE 5: Konteks Siswa & Beban Belajar (2 Fitur) */}
              {currentSlideIndex === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Riwayat Mengulang Modul</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.konteks_siswa?.num_of_prev_attempts ?? 0} kali
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Apakah siswa pernah mengambil modul ini di semester sebelumnya.</p>
                  </div>
                  <div className="p-5 rounded-2xl neo-card bg-white border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Beban Jam Belajar / SKS</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {selectedAlert.metrik_24_fitur_model?.konteks_siswa?.studied_credits ?? 60} jam
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Total beban kurikulum yang diambil pada semester aktif.</p>
                  </div>
                </div>
              )}

              {/* Dialog Footer: Navigasi Slide Bersatu & Aksi Tindak Lanjut */}
              <DialogFooter className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    type="button"
                    onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentSlideIndex === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 disabled:opacity-40 disabled:pointer-events-none cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <IconArrowLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>
                  {currentSlideIndex < DOMAIN_SLIDES.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentSlideIndex((prev) => Math.min(DOMAIN_SLIDES.length - 1, prev + 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <span>Berikutnya (Slide {currentSlideIndex + 2})</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 whitespace-nowrap">
                      <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> 24 Indikator Lengkap
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAlert) {
                        openActionModal(selectedAlert)
                      }
                    }}
                    className="px-4 py-2 rounded-xl neo-btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer shadow-2xs active:scale-95 transition-all"
                  >
                    Tindak Lanjut Siswa
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAlert(null)}
                    className="px-4 py-2 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer shadow-2xs active:scale-95 transition-all"
                  >
                    Tutup Rincian
                  </button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SHADCN DIALOG 2: Form Tindak Lanjut Guru Mapel */}
      <Dialog open={!!actionModalAlert} onOpenChange={(open) => !open && setActionModalAlert(null)}>
        <DialogContent className="max-w-md bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          {actionModalAlert && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-3.5">
                <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
                  AKSI TIER 1 GURU MAPEL
                </span>
                <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Tindak Lanjut Alert Belajar Siswa
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {actionModalAlert.student?.name || `Siswa ${actionModalAlert.siswa_id}`} &bull; Modul {actionModalAlert.kode_modul}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={submitAction} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pilih Status Tindakan
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value as any)}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none font-medium shadow-2xs"
                  >
                    <option value="konfirmasi_tugas">Konfirmasi Tugas di Kelas</option>
                    <option value="remedial">Jadwalkan Program Remedial</option>
                    <option value="selesai">Tandai Sudah Selesai Ditangani</option>
                    <option value="pending">Kembalikan ke Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Catatan Guru Mapel
                  </label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Contoh: Siswa sudah diingatkan di kelas untuk mengumpulkan kuis susulan modul AAA sebelum hari Jumat."
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <DialogFooter className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActionModalAlert(null)}
                    className="px-4 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="px-5 py-2.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <IconSave className="w-3.5 h-3.5" />
                    <span>{isSubmittingAction ? "Menyimpan..." : "Simpan Tindakan"}</span>
                  </button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

    </AppLayout>
  )
}
