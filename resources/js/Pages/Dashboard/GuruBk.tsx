import * as React from "react"
import {
  IconHandshake,
  IconExclamation,
  IconCalendar,
  IconCheck,
  IconShield,
  IconSearch,
  IconFilter,
  IconArrowUpRight,
  IconFile,
  IconUserCheck,
  IconChevronRight,
  IconLock,
  IconSave,
  IconMagicWand,
} from "@/components/ui/storage-icon"
import { Link, router } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EwsStatusBadge, type EwsStatus } from "@/components/ews/EwsStatusBadge"
import { PillarIndicators, type PillarStatuses } from "@/components/ews/PillarIndicators"
import { LinearScale } from "@/components/forms/LinearScale"
import { StudentAutocomplete, type StudentOption } from "@/components/forms/StudentAutocomplete"
import { AiBkStructuringModal, type AiBkDraftResult, type AiBkStructuredResult } from "@/components/ews/AiBkStructuringModal"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface BkCaseItem {
  id: number
  title: string
  student_name: string
  class_name: string
  severity: "RINGAN" | "SEDANG" | "BERAT"
  status: "BARU_DILAPORKAN" | "DALAM_PROSES" | "DIESKALASI_KE_KEPSEK" | "SELESAI"
  date: string
  counselor: string
}

interface HolisticStudentItem {
  id: number
  name: string
  nisn: string
  class_name: string
  grade: string
  pillars: PillarStatuses
  ews_status: EwsStatus
  trigger_reason: string
}

interface GuruBkProps {
  students?: { data: any[] }
  stats?: {
    total_students: number
    normal_count: number
    berisiko_count: number
    waspada_count: number
    kritis_count: number
    data_belum_lengkap_count: number
  }
  classes?: any[]
  watchlist?: any[]
  recentCases?: BkCaseItem[]
  allStudentOptions?: StudentOption[]
}

export default function GuruBk({
  students,
  stats,
  watchlist: initialWatchlist = [],
  recentCases: initialRecentCases = [],
  allStudentOptions: initialStudentOptions = [],
}: GuruBkProps) {
  const studentOptions = initialStudentOptions
  const watchlist = initialWatchlist
  const recentCases = initialRecentCases

  const [selectedStudent, setSelectedStudent] = React.useState<StudentOption | null>(
    studentOptions.length > 0 ? studentOptions[0] : null
  )
  const [urgencyScore, setUrgencyScore] = React.useState(3)
  const [rapportScore, setRapportScore] = React.useState(3)
  const [resolutionProgress, setResolutionProgress] = React.useState(0)
  const [sessionType, setSessionType] = React.useState("KONSELING_INDIVIDU")
  const [confidentialNotes, setConfidentialNotes] = React.useState("")
  const [callParent, setCallParent] = React.useState(false)
  const [referPsychologist, setReferPsychologist] = React.useState(false)
  const [escalateKepsek, setEscalateKepsek] = React.useState(false)

  // AI BK Modal State
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)

  // Filters
  const [gradeFilter, setGradeFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  const handleStructureWithAi = () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan pilih siswa binaan yang sedang menjalani sesi konseling.",
        variant: "destructive",
      })
      return
    }

    setIsAiModalOpen(true)
  }

  const handleApplyAiDraft = (draft: AiBkDraftResult) => {
    if (draft.generated_narrative) {
      setConfidentialNotes(draft.generated_narrative)
    }
    if (draft.urgency_level) {
      setUrgencyScore(draft.urgency_level === "BERAT" ? 5 : draft.urgency_level === "SEDANG" ? 3 : 1)
    }

    toast({
      title: "Draf Konseling AI Terpasang di Langkah 3",
      description: "Catatan sesi konseling berhasil dipasang. Silakan tinjau sebelum menyimpan.",
    })
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSaveCounselingSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Pilih siswa melalui kolom pencarian sebelum menyimpan sesi.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    router.post(
      "/guru-bk/cases",
      {
        student_id: selectedStudent.id,
        incident_date: new Date().toISOString().split("T")[0],
        reported_date: new Date().toISOString().split("T")[0],
        case_types: ["SOSIAL_PERILAKU"],
        bullying_role: null,
        severity: urgencyScore >= 4 ? "BERAT" : urgencyScore === 3 ? "SEDANG" : "RINGAN",
        status: escalateKepsek ? "DIESKALASI_KE_KEPSEK" : "DALAM_PROSES",
        follow_up_actions: [callParent ? "Panggil Orang Tua" : "Konseling Individu"],
        involved_students_count: 1,
        confidential_notes: confidentialNotes,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Sesi Konseling Berhasil Disimpan",
            description: `Log konseling untuk ${selectedStudent.name} tersimpan di rekam medis BK.`,
            variant: "success",
          })
          setConfidentialNotes("")
        },
        onError: (err) => {
          toast({
            title: "Gagal Menyimpan Kasus",
            description: Object.values(err).join(", "),
            variant: "destructive",
          })
        },
        onFinish: () => {
          setIsSubmitting(false)
        },
      }
    )
  }

  const studentDataList = students?.data || []
  const holisticList: HolisticStudentItem[] = studentDataList.map((s: any) => ({
    id: s.id,
    name: s.name,
    nisn: s.nisn,
    class_name: s.classes?.[0]?.name || s.class_name || "-",
    grade: s.classes?.[0]?.name?.startsWith("10") ? "X" : s.classes?.[0]?.name?.startsWith("11") ? "XI" : "XII",
    pillars: {
      ak: s.ews_score?.academic_sub_status || "DATA_BELUM_LENGKAP",
      kh: s.ews_score?.attendance_sub_status || "DATA_BELUM_LENGKAP",
      pr: s.ews_score?.behavior_sub_status || "NORMAL",
      bk: s.ews_score?.bk_sub_status || "NORMAL"
    },
    ews_status: s.ews_score?.status || "DATA_BELUM_LENGKAP",
    trigger_reason: s.ews_score?.triggered_by_parameters?.join(", ") || "Data pilar dikumpulkan",
  }))

  const filteredMatrix = holisticList.filter((item) => {
    const matchGrade = gradeFilter === "ALL" || item.grade === gradeFilter
    const matchStatus = statusFilter === "ALL" || item.ews_status === statusFilter
    return matchGrade && matchStatus
  })

  const totalSchool = stats?.total_students || studentOptions.length
  const kritisSchool = stats?.kritis_count || 0
  const waspadaSchool = stats?.waspada_count || 0
  const totalCases = recentCases.length
  const activeCasesCount = recentCases.filter((c) => c.status === "DALAM_PROSES" || c.status === "BARU_DILAPORKAN").length
  const inMediationCount = recentCases.filter((c) => c.status === "DALAM_PROSES").length
  const completedCount = recentCases.filter((c) => c.status === "SELESAI").length
  const escalatedCount = recentCases.filter((c) => c.status === "DIESKALASI_KE_KEPSEK" || c.severity === "BERAT").length
  const resolutionRate = totalCases > 0 ? Math.round((completedCount / totalCases) * 100) : 100

  return (
    <AppLayout
      currentRole="guru_bk"
      activeMenu="dashboard_bk"
      title="Portofolio Bimbingan Konseling & Watchlist EWS"
      subtitle="Pemantauan siswa berisiko tinggi dan penanganan kasus lintas kelas sekolah"
    >
      {/* 4-Card Operational Bento Grid for Guru BK with Varied Direction Ambient Silhouette Glow */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 - LEFT: Watchlist Prioritas EWS & Siswa Butuh Atensi (8 Cols) - Top-Right Glow */}
        <div
          className="md:col-span-8 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-5 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 92% -8%, rgba(244, 63, 94, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  Watchlist Prioritas EWS
                </span>
                <span className="text-xs font-semibold text-slate-500">Triage Konselor</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Siswa Membutuhkan Intervensi Bimbingan Konseling
              </h2>
            </div>

            <div className="w-12 h-12 rounded-2xl neo-btn text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconExclamation className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="text-5xl sm:text-6xl font-extrabold text-rose-600 tracking-tight">
                {watchlist.length}
              </span>
              <div className="space-y-0.5">
                <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
                  Siswa Terdeteksi Anomali Risiko
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  {kritisSchool} Status Kritis &bull; {waspadaSchool} Status Waspada &bull; {activeCasesCount} Kasus Aktif Berjalan
                </span>
              </div>
            </div>

            {/* Quick Watchlist Preview inside neo-inset */}
            <div className="p-3.5 rounded-2xl neo-inset bg-[#E7EDF4] space-y-2.5 border border-slate-300/40">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Rincian Siswa Prioritas Pekan Ini</span>
                <span className="font-semibold text-slate-500">{totalSchool} Total Siswa Binaan</span>
              </div>

              {watchlist.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {watchlist.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/students/${item.id}`}
                      className="inline-flex items-center gap-2 p-1.5 px-3 rounded-full bg-white/95 hover:bg-white border border-slate-200/80 text-xs font-bold text-slate-800 transition-all shadow-2xs hover:shadow-xs group/item"
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", item.status === "KRITIS" ? "bg-rose-500" : "bg-orange-500")} />
                      <span>{item.name}</span>
                      <span className="text-slate-500 font-normal">({item.class_name})</span>
                      <IconChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                  {watchlist.length > 3 && (
                    <a href="#matriks" className="text-xs font-bold text-blue-600 hover:text-blue-800 p-1 px-2">
                      +{watchlist.length - 3} Siswa Lainnya &rarr;
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-2 px-3 rounded-xl border border-emerald-200">
                  <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kondisi Kondusif: Seluruh siswa berada di zona normal tanpa anomali perilaku aktif.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 1 - RIGHT: Efektivitas Resolusi Kasus BK (4 Cols) - Right-Center Gauge Glow */}
        <div
          className="md:col-span-4 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 88% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 block">
                Resolusi Kasus BK
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Tingkat Sesi Selesai
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 py-1 relative z-10">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 tracking-tight">
                  {resolutionRate}%
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {completedCount} dari {totalCases} sesi tuntas mencapai target komitmen bimbingan.
              </p>
            </div>

            {/* SVG Radial Gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600"
                  strokeDasharray={`${resolutionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <IconCheck className="w-5 h-5 text-emerald-600 absolute" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Protokol Konseling Kondusif</span>
            </span>
          </div>
        </div>

        {/* ROW 2 - LEFT: Sesi Dalam Mediasi & Kasus Aktif (6 Cols) - Top-Left Glow */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 12% -12%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 block">
                Sesi Dalam Mediasi &amp; Bimbingan
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Tahap Pendampingan Komitmen Pekan Ini
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconCalendar className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-amber-600 tracking-tight">
                {inMediationCount}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Kasus Berjalan ({activeCasesCount} Total Kasus Aktif)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Tahap pendampingan lanjutan, observasi komitmen belajar, &amp; bimbingan kelompok teman sebaya.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold relative z-10">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
              Jadwal Sesi Pekan Ini
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Monitoring Dinamis</span>
          </div>
        </div>

        {/* ROW 2 - RIGHT: Eskalasi Kebijakan & Kasus Berat (6 Cols) - Bottom-Right Glow */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 90% 105%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-800 block">
                Eskalasi &amp; Kasus Berat
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Rujukan Psikolog &amp; Disposisi Manajemen
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconLock className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">
                {escalatedCount}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Kasus Butuh Koordinasi Manajemen
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Membutuhkan rujukan psikolog luar, PPA, atau koordinasi langsung kebijakan Kepala Sekolah.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold relative z-10">
            <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
              Disposisi Kebijakan
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Koordinasi Kepala Sekolah</span>
          </div>
        </div>
      </div>

      {/* Main Action Panel: Balanced 2-Column Layout for Guru BK */}
      <section
        id="kasus"
        className="p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <IconHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Pencatatan Sesi Konseling &amp; Penanganan Kasus
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Konselor BK &bull; AI
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Dokumentasi terenkripsi rekam bimbingan dan tindak lanjut psikososial siswa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold shrink-0">
            <IconLock className="w-4 h-4 text-emerald-600" />
            <span>Kerahasiaan Terjamin (UU PDP No. 27/2022)</span>
          </div>
        </div>

        <form onSubmit={handleSaveCounselingSession} className="space-y-6">
          {/* 2-COLUMN BALANCED FORM LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Student Select, Service Type & Verbatim Notes */}
            <div className="lg:col-span-7 space-y-4">
              {/* STEP 1: Cross-Class Autocomplete */}
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
                  1. Pilih Siswa (Lintas Seluruh Kelas):
                </Label>
                <StudentAutocomplete
                  students={studentOptions}
                  selectedStudent={selectedStudent}
                  onSelect={setSelectedStudent}
                  placeholder="Cari siswa seluruh sekolah berdasarkan nama atau NISN..."
                />
              </div>

              {/* STEP 2: Service Type Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
                  2. Jenis Layanan / Sesi Konseling:
                </Label>
                <select
                  id="sessionType"
                  aria-label="Pilih jenis layanan atau sesi konseling"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="KONSELING_INDIVIDU">Konseling Individu Personal</option>
                  <option value="MEDIASI_PEER">Mediasi Konflik Teman Sebaya</option>
                  <option value="BIMBINGAN_KELOMPOK">Bimbingan Kelompok Terarah</option>
                  <option value="KONFERENSI_ORTU">Konferensi Kasus Bersama Wali Murid</option>
                </select>
              </div>

              {/* STEP 3: Confidential Verbatim Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidentialNotes" className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <IconLock className="w-4 h-4 text-emerald-600" />
                    <span>3. Catatan Sesi Konseling Verbatim:</span>
                  </Label>
                  <span className="text-xs text-slate-500">
                    Akses konselor BK
                  </span>
                </div>

                {/* Relative Container for Textarea with AI Button in Bottom Right */}
                <div className="relative">
                  <Textarea
                    id="confidentialNotes"
                    rows={8}
                    value={confidentialNotes}
                    onChange={(e) => setConfidentialNotes(e.target.value)}
                    placeholder="Tuliskan catatan dinamika bimbingan, konseling, atau mediasi secara verbatim..."
                    className="w-full rounded-2xl border-slate-200 p-4 pb-14 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50"
                  />

                  {/* AI Assistance Button */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <IconMagicWand className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Ekstraksi AI &bull; Case Structuring</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Parameters, Escalation Checkboxes & Submit Action */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
                <Label className="text-xs sm:text-sm font-bold text-slate-800 block border-b border-slate-200/80 pb-2">
                  4. Parameter Evaluasi Konseling BK:
                </Label>

                {/* Scale 1: Urgensi Kasus */}
                <LinearScale
                  label="Urgensi / Keparahan Kasus"
                  description="Penilaian dampak terhadap psikososial siswa"
                  min={1}
                  max={5}
                  value={urgencyScore}
                  onChange={setUrgencyScore}
                  minLabel="1 (Rutin)"
                  midLabel="3 (Perhatian)"
                  maxLabel="5 (Kritis)"
                />

                {/* Scale 2: Indeks Keterbukaan */}
                <LinearScale
                  label="Keterbukaan & Rapport Siswa"
                  description="Tingkat kooperatif dan refleksi diri siswa"
                  min={1}
                  max={5}
                  value={rapportScore}
                  onChange={setRapportScore}
                  minLabel="1 (Resisten)"
                  midLabel="3 (Kooperatif)"
                  maxLabel="5 (Terbuka)"
                />

                {/* Scale 3: Progres Resolusi */}
                <LinearScale
                  label="Progres Resolusi Kasus"
                  description="Pencapaian target komitmen yang disepakati"
                  min={0}
                  max={100}
                  step={10}
                  mode="continuous"
                  value={resolutionProgress}
                  onChange={setResolutionProgress}
                  minLabel="0% (Baru)"
                  maxLabel="100% (Tuntas)"
                />

                {/* Follow-up Checkboxes */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                    Rencana Tindak Lanjut &amp; Eskalasi:
                  </span>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={callParent}
                        onChange={(e) => setCallParent(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Panggil Orang Tua</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={referPsychologist}
                        onChange={(e) => setReferPsychologist(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Rujuk ke Psikolog/PPA</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-rose-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={escalateKepsek}
                        onChange={(e) => setEscalateKepsek(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span>Eskalasi ke Kepala Sekolah</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* STEP 5: Action Submit Button */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-600 leading-snug">
                  Sesi yang disimpan akan memperbarui Pilar BK dalam EWS.
                </p>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-10 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <IconSave className="w-4 h-4 text-white" />
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan Catatan Konseling"}</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Split Section: Watchlist & Recent Cases Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Priority EWS Watchlist */}
        <div className="lg:col-span-6 p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Siswa Prioritas Penanganan (Watchlist)
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {watchlist.length} Siswa
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Siswa berstatus Kritis &amp; Waspada yang memerlukan perhatian khusus
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {watchlist.length === 0 ? (
              <div className="p-6 text-center text-xs sm:text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100">
                Tidak ada siswa berstatus Kritis atau Waspada saat ini.
              </div>
            ) : (
              watchlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900">{item.name}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">
                          {item.class_name}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Faktor Pemicu: <span className="text-slate-900 font-semibold">{item.trigger}</span>
                      </p>
                    </div>

                    <EwsStatusBadge status={item.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs sm:text-sm">
                    <span className="text-xs sm:text-sm text-amber-700 font-bold">
                      {item.urgency}
                    </span>
                    <Link
                      href={`/students/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Buka Lembar BK</span>
                      <IconArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Counseling Case Feed */}
        <div className="lg:col-span-6 p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Riwayat Sesi Konseling Terkini
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Progres penanganan dan status tindak lanjut kasus siswa
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recentCases.length === 0 ? (
              <div className="p-6 text-center text-xs sm:text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100">
                Belum ada catatan kasus konseling aktif.
              </div>
            ) : (
              recentCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 hover:bg-slate-100/70 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{caseItem.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {caseItem.student_name} ({caseItem.class_name}) &bull; {caseItem.date}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-md text-xs font-bold uppercase",
                        caseItem.status === "DIESKALASI_KE_KEPSEK"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : caseItem.status === "DALAM_PROSES"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      )}
                    >
                      {caseItem.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>Konselor: {caseItem.counselor}</span>
                    <span
                      className={cn(
                        "font-bold",
                        caseItem.severity === "BERAT" ? "text-rose-600" : "text-slate-700"
                      )}
                    >
                      Kategori: {caseItem.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Holistic Student Matrix Across School */}
      <section
        id="matriks"
        className="p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
              Matriks Siswa Seluruh Sekolah (Cross-Class EWS)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Konsolidasi 4 pilar EWS di seluruh jenjang kelas (X, XI, XII)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={gradeFilter}
              aria-label="Filter jenjang tingkat kelas"
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>

            <select
              value={statusFilter}
              aria-label="Filter status risiko siswa EWS"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Semua Status EWS</option>
              <option value="NORMAL">Normal</option>
              <option value="BERISIKO">Berisiko</option>
              <option value="WASPADA">Waspada</option>
              <option value="KRITIS">Kritis</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-[#F0F3F8] text-slate-600 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Siswa</th>
                <th className="py-3.5 px-3">Kelas / Jenjang</th>
                <th className="py-3.5 px-3">Pilar AK</th>
                <th className="py-3.5 px-3">Pilar KH</th>
                <th className="py-3.5 px-3">Pilar PR</th>
                <th className="py-3.5 px-3">Pilar BK</th>
                <th className="py-3.5 px-3">Status EWS</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatrix.map((student) => (
                <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="py-4 px-4 font-bold text-sm sm:text-base text-slate-900">
                    {student.name}
                    <span className="block text-xs text-slate-500 font-normal font-mono">
                      NISN: {student.nisn}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                      {student.class_name}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.ak} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.kh} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.pr} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.bk} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.ews_status} size="sm" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/students/${student.id}`}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 p-2 rounded-xl hover:bg-indigo-50"
                    >
                      <span>Lembar Kasus</span>
                      <IconChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI BK Auto-Complete Modal */}
      <AiBkStructuringModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyToForm={handleApplyAiDraft}
        studentName={selectedStudent?.name || "Siswa"}
        initialRawText={confidentialNotes}
      />
    </AppLayout>
  )
}
