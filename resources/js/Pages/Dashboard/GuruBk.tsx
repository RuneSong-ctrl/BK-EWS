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
import { BkCaseSuccessModal, type BkCaseSuccessDetail } from "@/components/ews/BkCaseSuccessModal"
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
  const [problemDomain, setProblemDomain] = React.useState("PRIBADI_SOSIAL")
  const [serviceFormat, setServiceFormat] = React.useState("KONSELING_INDIVIDU")
  const [urgencyLevel, setUrgencyLevel] = React.useState<"RINGAN" | "SEDANG" | "BERAT">("SEDANG")
  const [opennessScore, setOpennessScore] = React.useState(3)
  const [caseResolutionStatus, setCaseResolutionStatus] = React.useState<"DALAM_PROSES" | "SELESAI">("DALAM_PROSES")
  const [notes, setNotes] = React.useState("")

  // Tindak Lanjut Checkboxes
  const [callParent, setCallParent] = React.useState(false)
  const [scheduleNextSession, setScheduleNextSession] = React.useState(false)
  const [referExternal, setReferExternal] = React.useState(false)
  const [escalateKepsek, setEscalateKepsek] = React.useState(false)

  // AI BK Modal State
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [successModalDetail, setSuccessModalDetail] = React.useState<BkCaseSuccessDetail | null>(null)

  // Filters
  const [gradeFilter, setGradeFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  const handleApplyAiDraft = (draft: AiBkDraftResult) => {
    if (draft.generated_narrative) {
      setNotes(draft.generated_narrative)
    }
    if (draft.urgency_level) {
      setUrgencyLevel(draft.urgency_level)
    }

    toast({
      title: "Catatan AI Terpasang",
      description: "Draf catatan hasil bimbingan telah dimasukkan ke dalam form. Silakan tinjau sebelum menyimpan.",
    })
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSaveCounselingSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan pilih nama siswa yang diberikan bimbingan konseling.",
        variant: "destructive",
      })
      return
    }

    if (!notes.trim()) {
      toast({
        title: "Isi Catatan Bimbingan",
        description: "Tuliskan ringkasan masalah atau hasil konseling siswa.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const currentStudent = selectedStudent
    const currentNotes = notes
    const currentUrgency = urgencyLevel
    const currentStatus =
      caseResolutionStatus === "SELESAI"
        ? "SELESAI"
        : escalateKepsek
        ? "DIESKALASI_KE_KEPSEK"
        : referExternal
        ? "DIRUJUK_EKSTERNAL"
        : "DALAM_PROSES"

    const currentFollowUp = [
      ...(callParent ? ["Pemanggilan Orang Tua"] : []),
      ...(scheduleNextSession ? ["Sesi Konseling Lanjutan"] : []),
      ...(referExternal ? ["Rujukan Ahli / Psikolog"] : []),
      ...(escalateKepsek ? ["Koordinasi Kepala Sekolah"] : []),
    ]
    if (currentFollowUp.length === 0) {
      currentFollowUp.push("Pemantauan Berkala")
    }

    router.post(
      "/guru-bk/cases",
      {
        student_id: currentStudent.id,
        incident_date: new Date().toISOString().split("T")[0],
        reported_date: new Date().toISOString().split("T")[0],
        case_types: [problemDomain, serviceFormat],
        bullying_role: null,
        severity: currentUrgency,
        status: currentStatus,
        follow_up_actions: currentFollowUp,
        involved_students_count: 1,
        confidential_notes: currentNotes,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSuccessModalDetail({
            student_id: currentStudent.id,
            student_name: currentStudent.name,
            class_name: currentStudent.class_name,
            nisn: currentStudent.nisn || "-",
            date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            category: `${problemDomain} • ${serviceFormat}`,
            severity: currentUrgency,
            status: currentStatus,
            follow_up: currentFollowUp,
            notes: currentNotes,
          })
          setNotes("")
          setCallParent(false)
          setScheduleNextSession(false)
          setReferExternal(false)
          setEscalateKepsek(false)
          toast({
            title: "Catatan Bimbingan Berhasil Disimpan",
            description: `Rekam bimbingan untuk ${currentStudent.name} tersimpan dan EWS diperbarui.`,
          })
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
      title="Layanan Bimbingan Konseling & Pemantauan EWS"
      subtitle="Deteksi dini risiko siswa lintas jenjang dan pencatatan rekam konseling terpadu"
    >
      {/* Top Quick-Action Navigation Bar */}
      <div className="p-4 sm:p-5 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 flex flex-wrap items-center justify-between gap-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl neo-btn bg-[#EEF2F7] text-indigo-700 flex items-center justify-center shrink-0 border border-white/90">
            <IconHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Ruang Kerja Guru BK (Bimbingan Konseling)
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold neo-pill bg-indigo-50/80 text-indigo-800 border border-white/80">
                Seluruh Kelas X - XII
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {totalSchool} Total Siswa &bull; {watchlist.length} Siswa Terdeteksi Butuh Perhatian Khusus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="#form-bk"
            className="px-4 py-2.5 rounded-2xl neo-btn-primary text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <IconFile className="w-4 h-4 text-white" />
            <span>Catat Layanan Bimbingan</span>
          </a>

          <a
            href="#matriks"
            className="px-4 py-2.5 rounded-2xl neo-btn bg-[#EEF2F7] text-slate-700 hover:text-slate-900 text-xs font-bold inline-flex items-center gap-2 border border-white/90 transition-all cursor-pointer"
          >
            <IconSearch className="w-4 h-4 text-slate-500" />
            <span>Daftar Siswa &amp; Status EWS</span>
          </a>
        </div>
      </div>

      {/* 4-Card Operational Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 - LEFT: Watchlist Prioritas EWS (8 Cols) */}
        <div
          className="md:col-span-8 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-5 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 92% -8%, rgba(244, 63, 94, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold neo-pill bg-rose-50/80 text-rose-800 border border-white/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  Perhatian Segera
                </span>
                <span className="text-xs font-semibold text-slate-500">Prioritas Tindak Lanjut</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Siswa Membutuhkan Pendampingan Bimbingan Konseling
              </h2>
            </div>

            <div className="w-12 h-12 rounded-2xl neo-btn text-rose-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconExclamation className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="text-5xl sm:text-6xl font-extrabold text-rose-600 tracking-tight font-mono">
                {watchlist.length}
              </span>
              <div className="space-y-0.5">
                <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
                  Siswa Masuk Kategori Kritis &amp; Waspada
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  {kritisSchool} Status Kritis &bull; {waspadaSchool} Status Waspada &bull; {activeCasesCount} Kasus Sedang Berjalan
                </span>
              </div>
            </div>

            {/* Quick Watchlist Preview inside neo-inset */}
            <div className="p-3.5 rounded-2xl neo-inset bg-[#E7EDF4] space-y-2.5 border border-slate-300/40">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Rincian Siswa Butuh Penanganan Pekan Ini</span>
                <span className="font-semibold text-slate-500">{totalSchool} Total Siswa</span>
              </div>

              {watchlist.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {watchlist.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/students/${item.id}`}
                      className="inline-flex items-center gap-2 p-1.5 px-3 rounded-full neo-card-subtle bg-[#EEF2F7] hover:bg-white border border-white/90 text-xs font-bold text-slate-800 transition-all group/item"
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", item.status === "KRITIS" ? "bg-rose-500" : "bg-orange-500")} />
                      <span>{item.name}</span>
                      <span className="text-slate-500 font-normal">({item.class_name})</span>
                      <IconChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                  {watchlist.length > 3 && (
                    <a href="#matriks" className="text-xs font-bold text-blue-700 hover:text-blue-900 p-1 px-2">
                      +{watchlist.length - 3} Siswa Lainnya &rarr;
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 neo-card-subtle bg-[#EEF2F7] p-2.5 px-3.5 rounded-xl border border-white/90">
                  <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kondisi Kondusif: Seluruh siswa saat ini berada di zona aman tanpa anomali perilaku kritis.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 1 - RIGHT: Tingkat Penyelesaian Sesi (4 Cols) */}
        <div
          className="md:col-span-4 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 88% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 block">
                Penyelesaian Kasus
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Tingkat Masalah Tuntas
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 py-1 relative z-10">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 tracking-tight font-mono">
                  {resolutionRate}%
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {completedCount} dari {totalCases} sesi bimbingan telah selesai mencapai kesepakatan positif.
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
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 neo-pill bg-emerald-50/80 px-3.5 py-1 rounded-full border border-white/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Progres Layanan Positif</span>
            </span>
          </div>
        </div>

        {/* ROW 2 - LEFT: Sesi Dalam Pendampingan (6 Cols) */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 12% -12%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 block">
                Sesi Dalam Pendampingan
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Kasus Aktif yang Sedang Dipantau Perubahannya
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconCalendar className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-amber-600 tracking-tight font-mono">
                {inMediationCount}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Siswa Dalam Tahap Bimbingan
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Siswa menjalani kontrak kesepakatan perubahan diri dan pemantauan berkala bersama wali kelas.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold relative z-10">
            <span className="text-[11px] font-bold text-amber-800 neo-pill bg-amber-50/80 px-2.5 py-1 rounded-lg border border-white/80">
              Tahap Pemantauan
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Bimbingan Berkelanjutan</span>
          </div>
        </div>

        {/* ROW 2 - RIGHT: Kasus Rujukan / Koordinasi (6 Cols) */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 88% 112%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-800 block">
                Kasus Rujukan / Koordinasi Khusus
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Melibatkan Orang Tua, Psikolog, atau Kepala Sekolah
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconLock className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight font-mono">
                {escalatedCount}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Kasus Butuh Penanganan Lanjut
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Memerlukan tindak lanjut pemanggilan wali murid, rujukan profesional luar, atau koordinasi kebijakan sekolah.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold relative z-10">
            <span className="text-[11px] font-bold text-blue-800 neo-pill bg-blue-50/80 px-2.5 py-1 rounded-lg border border-white/80">
              Koordinasi Lanjutan
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Wali Murid &bull; Pimpinan</span>
          </div>
        </div>
      </div>

      {/* Main Action Panel: Pencatatan Layanan Bimbingan Konseling */}
      <section
        id="form-bk"
        className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-6 scroll-mt-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90">
              <IconHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Form Pencatatan Layanan Bimbingan Konseling
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold neo-pill bg-indigo-50/80 text-indigo-800 border border-white/80">
                  Guru BK &bull; AI
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Dokumentasikan sesi konseling, dinamika masalah, dan kesepakatan tindak lanjut siswa secara terstruktur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl neo-pill bg-[#EEF2F7] border border-white/90 text-slate-700 text-xs sm:text-sm font-semibold shrink-0">
            <IconLock className="w-4 h-4 text-emerald-600" />
            <span>Kerahasiaan Data Terjamin</span>
          </div>
        </div>

        <form onSubmit={handleSaveCounselingSession} className="space-y-6">
          {/* 2-COLUMN BALANCED FORM LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Student Select, Problem Domain, Service Format & Notes */}
            <div className="lg:col-span-7 space-y-4">
              {/* 1. Pilih Siswa */}
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
                  1. Pilih Nama Siswa:
                </Label>
                <StudentAutocomplete
                  students={studentOptions}
                  selectedStudent={selectedStudent}
                  onSelect={setSelectedStudent}
                  placeholder="Ketik nama siswa atau NISN (semua kelas)..."
                />
              </div>

              {/* 2. Bidang Masalah & Bentuk Layanan (Side by Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
                    2. Bidang Bimbingan / Masalah:
                  </Label>
                  <select
                    value={problemDomain}
                    onChange={(e) => setProblemDomain(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl neo-card-subtle bg-[#EEF2F7] text-xs font-bold text-slate-800 border border-white/90 focus:outline-none cursor-pointer"
                  >
                    <option value="PRIBADI_EMOSI">Bimbingan Pribadi &amp; Emosi</option>
                    <option value="SOSIAL_PERTEMANAN">Hubungan Sosial &amp; Teman Sebaya</option>
                    <option value="BELAJAR_AKADEMIK">Kesulitan Belajar &amp; Motivasi</option>
                    <option value="KARIR_MASA_DEPAN">Bimbingan Karir &amp; Peminatan</option>
                    <option value="KEDISIPLINAN_TATA_TERTIB">Kedisiplinan &amp; Presensi</option>
                    <option value="DUGAAN_BULLYING">Dugaan Perundungan (Bullying)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
                    3. Bentuk Layanan BK:
                  </Label>
                  <select
                    value={serviceFormat}
                    onChange={(e) => setServiceFormat(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl neo-card-subtle bg-[#EEF2F7] text-xs font-bold text-slate-800 border border-white/90 focus:outline-none cursor-pointer"
                  >
                    <option value="KONSELING_INDIVIDU">Konseling Individual (Tatap Muka)</option>
                    <option value="MEDIASI_PEER">Mediasi Teman Sebaya</option>
                    <option value="BIMBINGAN_KELOMPOK">Bimbingan Kelompok Terarah</option>
                    <option value="KONFERENSI_KASUS">Konferensi Kasus (Bersama Ortu/Wali)</option>
                  </select>
                </div>
              </div>

              {/* 3. Catatan Ringkas Sesi Konseling */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes" className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <IconLock className="w-4 h-4 text-emerald-600" />
                    <span>4. Ringkasan Masalah &amp; Hasil Bimbingan:</span>
                  </Label>
                  <span className="text-xs text-slate-500 font-medium">
                    Catatan konselor BK
                  </span>
                </div>

                {/* Relative Container for Textarea with AI Button in Bottom Right */}
                <div className="relative rounded-2xl neo-inset bg-[#E7EDF4] p-1 border border-slate-300/40">
                  <Textarea
                    id="notes"
                    rows={8}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tuliskan dinamika pembicaraan, keluhan siswa, atau kesepakatan komitmen yang dicapai..."
                    className="w-full rounded-xl p-4 pb-14 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none resize-none font-sans"
                    required
                  />

                  {/* AI Assistance Button */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold neo-btn-primary text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <IconMagicWand className="w-3.5 h-3.5 text-indigo-200" />
                      <span>✨ Bantu Tulis AI</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Urgency, Openness, Follow-up & Resolution Status */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 sm:p-6 rounded-2xl neo-inset bg-[#E7EDF4] border border-slate-300/40 space-y-4">
                <Label className="text-xs sm:text-sm font-bold text-slate-800 block border-b border-slate-300/50 pb-2">
                  5. Evaluasi &amp; Tingkat Penanganan:
                </Label>

                {/* Urgency Level Buttons */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">Tingkat Urgensi Masalah:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: "RINGAN", label: "Ringan / Rutin", desc: "Konsultasi biasa", color: "text-emerald-800 bg-emerald-50/80" },
                        { key: "SEDANG", label: "Sedang", desc: "Perlu dipantau", color: "text-amber-800 bg-amber-50/80" },
                        { key: "BERAT", label: "Berat / Kritis", desc: "Tindakan cepat", color: "text-rose-800 bg-rose-50/80" },
                      ] as const
                    ).map((lvl) => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setUrgencyLevel(lvl.key)}
                        className={cn(
                          "p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border",
                          urgencyLevel === lvl.key
                            ? "neo-btn-primary text-white shadow-xs border-transparent font-extrabold"
                            : "neo-btn bg-[#EEF2F7] text-slate-700 hover:text-slate-900 border-white/90"
                        )}
                      >
                        <span>{lvl.label}</span>
                        <span className={cn("text-[10px] font-normal opacity-85", urgencyLevel === lvl.key ? "text-white/90" : "text-slate-500")}>
                          {lvl.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scale: Keterbukaan Siswa */}
                <LinearScale
                  label="Tingkat Keterbukaan Siswa"
                  description="Respon &amp; kooperatif siswa saat diajak berdialog"
                  min={1}
                  max={5}
                  value={opennessScore}
                  onChange={setOpennessScore}
                  minLabel="1 (Tertutup/Menolak)"
                  midLabel="3 (Cukup Terbuka)"
                  maxLabel="5 (Sangat Terbuka)"
                />

                {/* Rencana Tindak Lanjut Checkboxes */}
                <div className="p-4 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 space-y-2.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                    Rencana Tindak Lanjut (RTL):
                  </span>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleNextSession}
                        onChange={(e) => setScheduleNextSession(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>📅 Jadwalkan Sesi Bimbingan Lanjutan</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={callParent}
                        onChange={(e) => setCallParent(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>📞 Hubungi / Panggil Orang Tua (Wali Murid)</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={referExternal}
                        onChange={(e) => setReferExternal(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>🩺 Rujukan Ahli / Psikolog / Layanan Luar</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-rose-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={escalateKepsek}
                        onChange={(e) => setEscalateKepsek(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                      <span>🏛️ Lapor &amp; Koordinasi Kepala Sekolah</span>
                    </label>
                  </div>
                </div>

                {/* Status Kasus Pasca Sesi */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">Status Penanganan Kasus:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCaseResolutionStatus("DALAM_PROSES")}
                      className={cn(
                        "p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        caseResolutionStatus === "DALAM_PROSES"
                          ? "neo-btn bg-amber-100/90 text-amber-900 border-amber-300 font-extrabold shadow-2xs"
                          : "neo-card-subtle bg-[#EEF2F7] text-slate-600 border-white/90"
                      )}
                    >
                      🟡 Masih Dalam Proses
                    </button>

                    <button
                      type="button"
                      onClick={() => setCaseResolutionStatus("SELESAI")}
                      className={cn(
                        "p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        caseResolutionStatus === "SELESAI"
                          ? "neo-btn bg-emerald-100/90 text-emerald-900 border-emerald-300 font-extrabold shadow-2xs"
                          : "neo-card-subtle bg-[#EEF2F7] text-slate-600 border-white/90"
                      )}
                    >
                      🟢 Selesai / Tuntas
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Submit Button */}
              <div className="p-4 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-600 leading-snug">
                  Data yang disimpan akan langsung memperbarui skor <strong>Pilar BK</strong> pada sistem EWS siswa.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-11 px-6 neo-btn-primary text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all"
                >
                  <IconSave className="w-4 h-4 text-white" />
                  <span>{isSubmitting ? "Menyimpan Data..." : "Simpan Catatan Bimbingan"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Split Section: Watchlist & Recent Cases Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Priority EWS Watchlist */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Daftar Siswa Perlu Penanganan Segera
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold neo-pill bg-rose-50/80 text-rose-800 border border-white/80">
                  {watchlist.length} Siswa
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Siswa dengan status Kritis &amp; Waspada yang membutuhkan bimbingan konselor
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {watchlist.length === 0 ? (
              <div className="p-6 text-center text-xs sm:text-sm text-slate-400 neo-inset bg-[#E7EDF4] rounded-2xl border border-slate-300/40">
                Tidak ada siswa yang berada dalam status Kritis atau Waspada saat ini.
              </div>
            ) : (
              watchlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 flex flex-col justify-between gap-3 hover:bg-white/80 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900">{item.name}</span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold neo-pill bg-white text-slate-700 border border-white/80">
                          {item.class_name}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Pemicu Risiko: <span className="text-slate-900 font-semibold">{item.trigger}</span>
                      </p>
                    </div>

                    <EwsStatusBadge status={item.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-xs sm:text-sm">
                    <span className="text-xs sm:text-sm text-amber-800 font-bold">
                      {item.urgency}
                    </span>
                    <Link
                      href={`/students/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      <span>Buka Profil Siswa</span>
                      <IconArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Counseling Case Feed */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Riwayat Layanan Konseling Terakhir
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Daftar sesi bimbingan dan tindak lanjut yang telah dicatat oleh Guru BK
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recentCases.length === 0 ? (
              <div className="p-6 text-center text-xs sm:text-sm text-slate-400 neo-inset bg-[#E7EDF4] rounded-2xl border border-slate-300/40">
                Belum ada catatan bimbingan konseling yang tersimpan.
              </div>
            ) : (
              recentCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-4 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 space-y-2 hover:bg-white/80 transition-all"
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
                        "px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase neo-pill border border-white/90",
                        caseItem.status === "DIESKALASI_KE_KEPSEK"
                          ? "bg-rose-100/80 text-rose-800"
                          : caseItem.status === "DALAM_PROSES"
                            ? "bg-amber-100/80 text-amber-800"
                            : "bg-emerald-100/80 text-emerald-800"
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
                        caseItem.severity === "BERAT" ? "text-rose-700" : "text-slate-700"
                      )}
                    >
                      Urgensi: {caseItem.severity}
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
        className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-5 scroll-mt-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
              Daftar &amp; Status EWS Seluruh Siswa Sekolah
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekapitulasi 4 pilar (Akademik, Kehadiran, Perilaku, BK) di seluruh jenjang kelas (X, XI, XII)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={gradeFilter}
              aria-label="Filter jenjang tingkat kelas"
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none"
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
              className="h-10 px-3.5 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">Semua Status EWS</option>
              <option value="NORMAL">Normal</option>
              <option value="BERISIKO">Berisiko</option>
              <option value="WASPADA">Waspada</option>
              <option value="KRITIS">Kritis</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-[#E7EDF4] text-slate-700 font-bold uppercase tracking-wider text-xs border-b border-slate-200/60">
              <tr>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-3">Kelas</th>
                <th className="py-3.5 px-3">Pilar AK (Nilai)</th>
                <th className="py-3.5 px-3">Pilar KH (Absensi)</th>
                <th className="py-3.5 px-3">Pilar PR (Perilaku)</th>
                <th className="py-3.5 px-3">Pilar BK (Kasus)</th>
                <th className="py-3.5 px-3">Status EWS</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {filteredMatrix.map((student) => (
                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-4 px-4 font-bold text-sm sm:text-base text-slate-900">
                    {student.name}
                    <span className="block text-xs text-slate-500 font-normal font-mono">
                      NISN: {student.nisn}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold neo-pill bg-white text-slate-700 border border-white/80">
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
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-700 hover:text-indigo-900 p-2 rounded-xl neo-btn bg-[#EEF2F7] border border-white/90"
                    >
                      <span>Lihat Profil</span>
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
        initialRawText={notes}
      />

      {/* BK Case Saved Success Modal */}
      <BkCaseSuccessModal
        isOpen={!!successModalDetail}
        onClose={() => setSuccessModalDetail(null)}
        onAddAnother={() => setSuccessModalDetail(null)}
        detail={successModalDetail}
      />
    </AppLayout>
  )
}
