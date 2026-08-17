import * as React from "react"
import {
  IconGroup,
  IconTrendUp,
  IconAlert,
  IconCheck,
  IconChevronRight,
  IconChevronDown,
  IconBook,
  IconSave,
  IconGraduationCap,
  IconArrowUpRight,
  IconAi,
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
import { AiStructuringModal, type AiDraftResult, type AiStructuredResult } from "@/components/ews/AiStructuringModal"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface StudentRow {
  id: number
  name: string
  nisn: string
  class_name: string
  avg_score: number
  score_trend: "Naik" | "Turun" | "Stabil" | "-"
  attendance_rate: number
  alpa_count: number
  pillars: PillarStatuses
  ews_status: EwsStatus
}

interface GuruKelasProps {
  schoolClass?: {
    id: number
    name: string
    grade_level: number
    academic_year: string
  } | null
  students?: StudentRow[]
  stats?: {
    total_students: number
    normal_count: number
    berisiko_count: number
    waspada_count: number
    kritis_count: number
    data_belum_lengkap_count: number
  }
}

const QUICK_OBSERVATION_PROMPTS = [
  "Pasif dan menolak bergabung dalam tugas kelompok.",
  "Sering melamun dan kurang fokus saat jam pelajaran.",
  "Menunjukkan penurunan kedisiplinan dan tugas terlambat.",
  "Sangat aktif bertanya dan membantu rekan sekelas.",
]

export default function GuruKelas({ schoolClass, students: initialStudents = [], stats }: GuruKelasProps) {
  const studentList = initialStudents
  const className = schoolClass?.name || "10-MIPA-1"

  const [selectedStudent, setSelectedStudent] = React.useState<StudentOption | null>(
    studentList.length > 0
      ? {
        id: studentList[0].id,
        name: studentList[0].name,
        nisn: studentList[0].nisn,
        class_name: studentList[0].class_name || className,
        ews_status: studentList[0].ews_status,
      }
      : null
  )
  const [observationDate, setObservationDate] = React.useState(new Date().toISOString().split("T")[0])
  const [participationScore, setParticipationScore] = React.useState(3)
  const [homeworkScore, setHomeworkScore] = React.useState(3)
  const [quizScore, setQuizScore] = React.useState(75)
  const [rawText, setRawText] = React.useState("")

  // AI Auto-Complete Modal State
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)

  // Table Filter & Segment Tab
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [activeTab, setActiveTab] = React.useState<"ALL" | "ATENSI" | "PRESENSI_RENDAH" | "NILAI_TURUN">("ALL")

  const studentAutocompleteOptions: StudentOption[] = studentList.map((s) => ({
    id: s.id,
    name: s.name,
    nisn: s.nisn,
    class_name: s.class_name || className,
    ews_status: s.ews_status,
  }))

  const handleAppendPrompt = (promptText: string) => {
    setRawText((prev) => (prev ? `${prev.trim()} ${promptText}` : promptText))
  }

  const handleResetForm = () => {
    setRawText("")
    setParticipationScore(3)
    setHomeworkScore(3)
    setQuizScore(75)
    toast({
      title: "Form Direset",
      description: "Parameter observasi telah dikembalikan ke nilai default.",
    })
  }

  const handleStructureWithAi = () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan pilih siswa binaan yang akan dicatat observasinya.",
        variant: "destructive",
      })
      return
    }

    setIsAiModalOpen(true)
  }

  const handleApplyAiDraft = (draft: AiDraftResult) => {
    if (draft.generated_narrative) {
      setRawText(draft.generated_narrative)
    }

    toast({
      title: "Draf Naratif AI Terpasang di Langkah 2",
      description: "Catatan naratif berhasil dipasang. Silakan periksa atau sesuaikan sebelum menyimpan.",
    })
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleManualSave = () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan tentukan siswa binaan yang akan diobservasi.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    router.post(
      "/guru-kelas/observations",
      {
        student_id: selectedStudent.id,
        date: observationDate,
        participation_score: participationScore,
        homework_score: homeworkScore,
        quiz_score: quizScore,
        notes: rawText,
        raw_text: rawText || "Observasi harian",
        category: "TIDAK_FOKUS",
        severity: participationScore <= 2 ? "SEDANG" : "RINGAN",
        ai_structured_summary: rawText ? rawText.substring(0, 150) : "Evaluasi harian wali kelas.",
      },
      {
        onSuccess: () => {
          toast({
            title: "Observasi Berhasil Disimpan",
            description: `Evaluasi harian untuk ${selectedStudent.name} telah dicatat dan skor EWS diperbarui.`,
          })
          setRawText("")
        },
        onError: () => {
          toast({
            title: "Gagal Menyimpan Data",
            description: "Pastikan seluruh isian formulir telah valid.",
            variant: "destructive",
          })
        },
        onFinish: () => {
          setIsSubmitting(false)
        },
      }
    )
  }

  // Filter students based on search, dropdown, and active tab
  const filteredStudents = studentList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDropdown =
      statusFilter === "ALL" ? true : s.ews_status === statusFilter

    let matchesTab = true
    if (activeTab === "ATENSI") {
      matchesTab = s.ews_status === "KRITIS" || s.ews_status === "WASPADA" || s.ews_status === "BERISIKO"
    } else if (activeTab === "PRESENSI_RENDAH") {
      matchesTab = Number(s.attendance_rate || 100) < 85
    } else if (activeTab === "NILAI_TURUN") {
      matchesTab = s.score_trend === "Turun"
    }

    return matchesSearch && matchesDropdown && matchesTab
  })

  const totalCount = stats?.total_students || studentList.length || 0
  const normalCount = stats?.normal_count || studentList.filter((s) => s.ews_status === "NORMAL").length || 0
  const berisikoCount = stats?.berisiko_count || studentList.filter((s) => s.ews_status === "BERISIKO").length || 0
  const waspadaCount = stats?.waspada_count || studentList.filter((s) => s.ews_status === "WASPADA").length || 0
  const kritisCount = stats?.kritis_count || studentList.filter((s) => s.ews_status === "KRITIS").length || 0
  const atensiCount = kritisCount + waspadaCount + berisikoCount
  const atensiStudents = studentList.filter(
    (s) => s.ews_status === "KRITIS" || s.ews_status === "WASPADA" || s.ews_status === "BERISIKO"
  )

  const studentsWithAtt = studentList.filter((s) => s.attendance_rate !== null && s.attendance_rate !== undefined)
  const avgAttNum =
    studentsWithAtt.length > 0
      ? Math.round(
        studentsWithAtt.reduce((acc, curr) => acc + (Number(curr.attendance_rate) || 0), 0) /
        studentsWithAtt.length
      )
      : 100
  const avgAttDisplay = `${avgAttNum}%`
  const lowAttendanceCount = studentList.filter((s) => Number(s.attendance_rate || 100) < 85).length

  const studentsWithScore = studentList.filter((s) => s.avg_score !== null && s.avg_score !== undefined)
  const classAvgScore =
    studentsWithScore.length > 0
      ? (
        studentsWithScore.reduce((acc, curr) => acc + (Number(curr.avg_score) || 0), 0) /
        studentsWithScore.length
      ).toFixed(1)
      : "-"
  const scoreDropCount = studentList.filter((s) => s.score_trend === "Turun").length
  const stableScoreCount = studentList.filter((s) => s.score_trend === "Stabil" || s.score_trend === "Naik").length

  return (
    <AppLayout
      currentRole="guru_kelas"
      activeMenu="dashboard"
      title={`Ringkasan Evaluasi & Jurnal Kelas ${className}`}
      subtitle="Pencatatan observasi perilaku siswa berbantuan AI dan pemantauan 4 pilar EWS"
    >
      {/* Top Quick Journaling Shortcut Bar (Clean Soft Design) */}
      <div className="p-4 sm:p-5 rounded-2xl neo-card bg-gradient-to-r from-blue-50/70 via-white/80 to-blue-50/40 border border-blue-200/60 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
            <IconBook className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Observasi Cepat Jurnal Kelas {className}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Catat dinamika perilaku harian atau anomali siswa secara langsung dengan asisten AI
            </p>
          </div>
        </div>
        <a
          href="#observasi"
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <IconChevronDown className="w-4 h-4 text-white" />
          <span>Mulai Observasi Jurnal</span>
        </a>
      </div>

      {/* 4-Card Operational Bento Grid for Guru Kelas with Varied Direction Ambient Silhouette Glow */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 - LEFT: Hero Ikhtisar Kelas & Pemantauan 4 Pilar EWS (8 Cols) - Top-Right Glow */}
        <div
          className="md:col-span-8 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 92% -8%, rgba(37, 99, 235, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  Kelas {className}
                </span>
                <span className="text-xs font-semibold text-slate-500">TP {schoolClass?.academic_year || "2026/2027"}</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Kesehatan Iklim &amp; Pemantauan 4 Pilar EWS Kelas
              </h2>
            </div>

            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconGroup className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
                {totalCount}
              </span>
              <div className="space-y-0.5">
                <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
                  Total Siswa Binaan Kelas
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  {kritisCount} Status Kritis &bull; {waspadaCount} Status Waspada &bull; {berisikoCount} Berisiko &bull; {normalCount} Normal
                </span>
              </div>
            </div>

            {/* Inset Sub-Grid for 4 Pillars Health Status in Kelas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  AK (Akademik)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {classAvgScore}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Rata-rata
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  KH (Kehadiran)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {avgAttDisplay}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                    lowAttendanceCount > 0
                      ? "text-rose-700 bg-rose-50 border-rose-200"
                      : "text-emerald-700 bg-emerald-50 border-emerald-200"
                  )}>
                    {lowAttendanceCount > 0 ? `${lowAttendanceCount} Perlu Atensi` : "Optimal"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  PR (Perilaku)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {atensiCount} Siswa
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                    atensiCount > 0
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-emerald-700 bg-emerald-50 border-emerald-200"
                  )}>
                    {atensiCount > 0 ? "Catatan Baru" : "Kondusif"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  BK (Konseling)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {kritisCount} Sesi
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    Ditangani
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1 - RIGHT: Kehadiran Agregat & Disiplin Kelas (4 Cols) - Right-Center Gauge Glow */}
        <div
          className="md:col-span-4 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 88% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 block">
                Presensi Tertib Kelas
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Pilar Kehadiran (KH) Bulan Ini
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconTrendUp className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 py-1 relative z-10">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 tracking-tight">
                  {avgAttDisplay}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Tingkat kehadiran siswa terakumulasi secara longitudinal.
              </p>
            </div>

            {/* SVG Radial Progress Gauge */}
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
                  strokeDasharray={`${avgAttNum}, 100`}
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
              <span>{lowAttendanceCount > 0 ? `${lowAttendanceCount} Siswa Presensi < 85%` : "Seluruh Siswa Tertib Hadir"}</span>
            </span>
          </div>
        </div>

        {/* ROW 2 - LEFT: Siswa Butuh Atensi & Observasi (Pilar PR) (6 Cols) - Top-Left Glow */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 12% -12%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 block">
                Pilar Perilaku (PR) &amp; Atensi
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Deteksi Dini Indikator Sikap Siswa
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-amber-600 tracking-tight">
                {atensiCount}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Siswa Perlu Pemantauan
              </span>
            </div>

            {/* Quick Chips of atensi students */}
            {atensiStudents.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {atensiStudents.slice(0, 3).map((s) => (
                  <Link
                    key={s.id}
                    href={`/students/${s.id}`}
                    className="inline-flex items-center gap-1.5 p-1 px-2.5 rounded-full bg-white/95 hover:bg-white border border-slate-200/80 text-xs font-bold text-slate-800 transition-all shadow-2xs hover:shadow-xs group/item"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        s.ews_status === "KRITIS"
                          ? "bg-rose-500"
                          : s.ews_status === "WASPADA"
                            ? "bg-orange-500"
                            : "bg-amber-400"
                      )}
                    />
                    <span>{s.name}</span>
                    <IconChevronRight className="w-3 h-3 text-slate-500 group-hover/item:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
                {atensiStudents.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("ATENSI")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 p-1 px-2 cursor-pointer"
                  >
                    +{atensiStudents.length - 3} Siswa Lain &rarr;
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-2 px-3 rounded-xl border border-emerald-200">
                <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kondisi Prima: Seluruh siswa kelas dalam zona hijau tanpa anomali perilaku/akademik.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold relative z-10">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
              Prioritas Observasi Jurnal
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{kritisCount} Kritis &bull; {waspadaCount} Waspada</span>
          </div>
        </div>

        {/* ROW 2 - RIGHT: Pilar Akademik (AK) & Tren Capaian Belajar (6 Cols) - Bottom-Right Glow */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 90% 105%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-800 block">
                Pilar Akademik (AK) &amp; Nilai
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Capaian Belajar &amp; Evaluasi Formatif
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconGraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">
                {classAvgScore}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Rata-rata Nilai Kelas ({studentsWithScore.length} Siswa Terdata)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {stableScoreCount} siswa dengan nilai stabil/meningkat, {scoreDropCount} siswa terindikasi penurunan skor.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs font-semibold relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/95 px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{scoreDropCount > 0 ? `${scoreDropCount} Siswa Perlu Remedial/Bimbingan` : "Akademik Kelas Stabil"}</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("NILAI_TURUN")}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Filter Nilai</span>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Action Panel: Balanced 2-Column Desktop Grid for Ergonomic Behavior Observation */}
      <section
        id="observasi"
        className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 scroll-mt-24"
      >
        {/* Header with Date Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconAi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Pencatatan Observasi Perilaku Siswa
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Asisten AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Catat dinamika perilaku harian untuk memperbarui indikator peringatan dini (EWS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-bold text-slate-600">Tanggal:</span>
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 2-COLUMN BALANCED FORM LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Student Selector & Narrative Textarea */}
          <div className="lg:col-span-7 space-y-4">
            {/* STEP 1: Search NISN or Student Name */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
                1. Pilih Siswa Binaan:
              </Label>
              <StudentAutocomplete
                students={studentAutocompleteOptions}
                selectedStudent={selectedStudent}
                onSelect={setSelectedStudent}
                placeholder="Ketik NISN atau nama siswa..."
              />
            </div>

            {/* STEP 2: Free Narrative Textarea with AI Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="rawText" className="text-xs sm:text-sm font-bold text-slate-800">
                  2. Catatan Naratif Wali Kelas:
                </Label>
                <span className="text-xs text-slate-500">
                  Indikasi perubahan sikap / kejadian di kelas
                </span>
              </div>

              {/* Relative Container for Textarea with AI Button in Bottom Right */}
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-1">
                <Textarea
                  id="rawText"
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Tuliskan catatan naratif bebas... Contoh: Siswa terlihat pasif 3 hari ini dan menolak bergabung saat kerja kelompok tugas biologi. Sering melamun saat jam pelajaran."
                  className="w-full p-4 pb-16 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed border-0 bg-transparent focus:ring-0 focus:outline-none resize-y min-h-[160px]"
                />

                {/* AI Drafting / Auto-Complete Button */}
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStructureWithAi}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <IconMagicWand className="w-4 h-4 text-white" />
                    <span>Bantu Tulis AI (Auto-Complete)</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Parameters & Save Action */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 block border-b border-slate-200/80 pb-2">
                3. Parameter Observasi Harian:
              </Label>

              {/* Scale 1: Partisipasi Kelas */}
              <LinearScale
                label="Partisipasi Kelas"
                description="Keaktifan interaksi & respons siswa di kelas"
                min={1}
                max={5}
                value={participationScore}
                onChange={setParticipationScore}
                minLabel="1 (Pasif)"
                midLabel="3 (Cukup)"
                maxLabel="5 (Aktif)"
              />

              {/* Scale 2: Kedisiplinan Tugas & PR */}
              <LinearScale
                label="Kedisiplinan Tugas & PR"
                description="Ketepatan waktu dan kelengkapan tugas"
                min={1}
                max={5}
                value={homeworkScore}
                onChange={setHomeworkScore}
                minLabel="1 (Jarang)"
                midLabel="3 (Sebagian)"
                maxLabel="5 (Tepat)"
              />

              {/* Scale 3: Pemahaman Materi / Kuis */}
              <LinearScale
                label="Skor Kuis / Pemahaman"
                description="Estimasi penguasaan materi formatif"
                min={0}
                max={100}
                step={5}
                mode="continuous"
                value={quizScore}
                onChange={setQuizScore}
                minLabel="0 (Rendah)"
                maxLabel="100 (Baik)"
              />
            </div>

            {/* STEP 4: Action Button */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-600 leading-snug">
                Data akan memperbarui 4 Pilar EWS secara langsung.
              </p>

              <Button
                type="button"
                onClick={handleManualSave}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
              >
                <IconSave className="w-4 h-4 text-white" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Observasi"}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Roster Table Section */}
      <section
        id="rekap"
        className="p-6 sm:p-8 rounded-3xl neo-card space-y-4 scroll-mt-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight">
              Matriks Siswa &amp; Evaluasi 4 Pilar EWS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Daftar seluruh siswa {className} beserta status agregat 4 Pilar
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Cari siswa di kelas..."
              aria-label="Cari siswa di kelas berdasarkan nama atau NISN"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 px-3.5 rounded-xl neo-inset bg-[#EEF2F7] text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 w-48 focus:outline-none"
            />

            <select
              value={statusFilter}
              aria-label="Filter status risiko siswa EWS"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl neo-inset bg-[#EEF2F7] text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">Semua Status EWS</option>
              <option value="NORMAL">Normal</option>
              <option value="BERISIKO">Berisiko</option>
              <option value="WASPADA">Waspada</option>
              <option value="KRITIS">Kritis</option>
              <option value="DATA_BELUM_LENGKAP">Data Belum Lengkap</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 neo-card-subtle bg-white">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-[#F0F3F8] text-slate-600 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-3">NISN</th>
                <th className="py-3.5 px-3">Rata Nilai</th>
                <th className="py-3.5 px-3">% Kehadiran</th>
                <th className="py-3.5 px-3">4 Pilar EWS</th>
                <th className="py-3.5 px-3">Status EWS</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center group-hover:border-blue-300">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-sm sm:text-base text-slate-900 block group-hover:text-blue-700">
                            {student.name}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {student.class_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 font-mono text-xs sm:text-sm text-slate-600">
                      {student.nisn}
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-xs sm:text-sm text-slate-800">
                          {student.avg_score !== null && student.avg_score !== undefined ? student.avg_score : "-"}
                        </span>
                        {student.score_trend !== "-" && (
                          <span
                            className={cn(
                              "text-xs font-semibold px-1.5 py-0.5 rounded",
                              student.score_trend === "Naik" || student.score_trend === "Stabil"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : student.score_trend === "Turun"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600"
                            )}
                          >
                            {student.score_trend}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <div>
                        <span className="font-bold font-mono text-xs sm:text-sm text-slate-800">
                          {student.attendance_rate !== null && student.attendance_rate !== undefined ? `${student.attendance_rate}%` : "-"}
                        </span>
                        {student.alpa_count > 0 && (
                          <span className="block text-xs text-rose-600 font-semibold">
                            {student.alpa_count}x Alpa
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <PillarIndicators pillars={student.pillars} />
                    </td>

                    <td className="py-4 px-3">
                      <EwsStatusBadge status={student.ews_status} size="sm" />
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 p-2 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        <span>Detail</span>
                        <IconChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs sm:text-sm text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Drafting & Auto-Complete Studio Modal */}
      <AiStructuringModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyToForm={handleApplyAiDraft}
        studentName={selectedStudent?.name || "Siswa"}
        initialRawText={rawText}
      />
    </AppLayout>
  )
}
