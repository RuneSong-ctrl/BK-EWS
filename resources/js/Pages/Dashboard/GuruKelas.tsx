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
  IconCalendarCheck,
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
import { QuickAttendanceModal } from "@/components/forms/QuickAttendanceModal"
import { QuickAcademicModal } from "@/components/forms/QuickAcademicModal"
import { ObservationSuccessModal, type SavedObservationDetail } from "@/components/ews/ObservationSuccessModal"
import { DatePickerInput } from "@/components/ui/date-picker-input"
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
  subjects?: {
    id: number
    code: string
    name: string
    passing_grade?: number
  }[]
}

export default function GuruKelas({
  schoolClass,
  students: initialStudents = [],
  stats,
  subjects = [],
}: GuruKelasProps) {
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

  // Keep selectedStudent in sync with refreshed studentList props
  React.useEffect(() => {
    if (selectedStudent && studentList.length > 0) {
      const updated = studentList.find((s) => s.id === selectedStudent.id)
      if (updated) {
        setSelectedStudent({
          id: updated.id,
          name: updated.name,
          nisn: updated.nisn,
          class_name: updated.class_name || className,
          ews_status: updated.ews_status,
        })
      }
    } else if (!selectedStudent && studentList.length > 0) {
      setSelectedStudent({
        id: studentList[0].id,
        name: studentList[0].name,
        nisn: studentList[0].nisn,
        class_name: studentList[0].class_name || className,
        ews_status: studentList[0].ews_status,
      })
    }
  }, [studentList])

  const [observationDate, setObservationDate] = React.useState(new Date().toISOString().split("T")[0])
  const [participationScore, setParticipationScore] = React.useState(3)
  const [homeworkScore, setHomeworkScore] = React.useState(3)
  const [quizScore, setQuizScore] = React.useState(3)
  const [rawText, setRawText] = React.useState("")

  // AI Auto-Complete Modal State
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = React.useState(false)
  const [isAcademicModalOpen, setIsAcademicModalOpen] = React.useState(false)
  const [savedObservationDetail, setSavedObservationDetail] = React.useState<SavedObservationDetail | null>(null)

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

  const handleStructureWithAi = () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan pilih nama siswa yang akan dicatat pengamatannya.",
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
      title: "Catatan AI Berhasil Dipasang",
      description: "Draf catatan pengamatan telah disalin ke formulir. Silakan sesuaikan jika diperlukan.",
    })
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleManualSave = () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan pilih nama siswa yang akan diobservasi.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const currentStudent = selectedStudent
    const currentText = rawText.trim()
    const currentScores = {
      participation: participationScore,
      homework: homeworkScore,
      quiz: quizScore,
    }
    const currentDate = observationDate

    // Calculate smart category & severity based on linear scales
    const isPositive = currentScores.participation >= 4 && currentScores.homework >= 4 && currentScores.quiz >= 4
    const isSevere = currentScores.participation <= 1 || currentScores.homework <= 1
    const category = isPositive ? "PERILAKU_POSITIF" : "TIDAK_FOKUS"
    const severity = isSevere ? "SEDANG" : "RINGAN"
    const finalNarrative = currentText || "Pengamatan rutin kelas oleh wali kelas."

    router.post(
      "/guru-kelas/observations",
      {
        student_id: currentStudent.id,
        date: currentDate,
        category: category,
        severity: severity,
        raw_text: finalNarrative,
        narrative: finalNarrative,
        ai_structured_summary: finalNarrative.length > 200 ? finalNarrative.substring(0, 197) + "..." : finalNarrative,
        scores: currentScores,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSavedObservationDetail({
            student_id: currentStudent.id,
            student_name: currentStudent.name,
            nisn: currentStudent.nisn,
            class_name: currentStudent.class_name || className,
            date: currentDate,
            category: category,
            severity: severity,
            narrative: finalNarrative,
            scores: currentScores,
          })
          toast({
            title: "Observasi Berhasil Disimpan",
            description: `Catatan pengamatan untuk ${currentStudent.name} telah tersimpan dan skor EWS dihitung ulang.`,
          })
          setRawText("")
        },
        onError: () => {
          toast({
            title: "Gagal Menyimpan Data",
            description: "Pastikan seluruh isian formulir telah diisi dengan benar.",
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
      title={`Dashboard Wali Kelas  ${className}`}
      subtitle="Pemantauan perkembangan siswa, presensi harian, nilai akademik, dan catatan jurnal observasi"
    >
      {/* Top Quick Action Bar */}
      <div className="p-5 sm:p-6 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full lg:w-auto">
          <div className="w-12 h-12 rounded-2xl neo-btn text-blue-700 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
            <IconBook className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Aksi Cepat Wali Kelas {className}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Input presensi harian, rekap nilai ujian/tugas, dan buat catatan pengamatan siswa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsAttendanceModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl neo-btn text-emerald-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/90 cursor-pointer transition-all shadow-2xs"
          >
            <IconCalendarCheck className="w-4 h-4 text-emerald-700" />
            <span>Input Presensi</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAcademicModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl neo-btn text-indigo-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/90 cursor-pointer transition-all shadow-2xs"
          >
            <IconGraduationCap className="w-4 h-4 text-indigo-700" />
            <span>Input Nilai Akademik</span>
          </button>
          <a
            href="#observasi"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl neo-btn-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <IconChevronDown className="w-4 h-4 text-white" />
            <span>Catat Jurnal Siswa</span>
          </a>
        </div>
      </div>

      {/* 4-Card Operational Bento Grid for Guru Kelas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 - LEFT: Hero Ringkasan Kondisi Kelas (8 Cols) */}
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
                Ringkasan Kondisi &amp; Pemantauan Siswa Kelas
              </h2>
            </div>

            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
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
                  Total Siswa di Kelas
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  {atensiCount > 0 ? `${atensiCount} Siswa Perlu Perhatian Khusus` : "Seluruh Siswa Kondusif"} • {normalCount} Siswa Aman/Normal
                </span>
              </div>
            </div>

            {/* Inset Sub-Grid for 4 Pillars Health Status in Kelas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Rata Nilai (AK)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {classAvgScore}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    KKM 75
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Kehadiran (KH)
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
                    {lowAttendanceCount > 0 ? `${lowAttendanceCount} Sering Alpa` : "Optimal"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Observasi (PR)
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
                    {atensiCount > 0 ? "Perlu Dipantau" : "Kondusif"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl neo-inset bg-[#E7EDF4] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Layanan BK
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {kritisCount} Siswa
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    {kritisCount > 0 ? "Didampingi" : "Aman"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1 - RIGHT: Tingkat Kehadiran Kelas (4 Cols) */}
        <div
          className="md:col-span-4 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 88% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 block">
                Tingkat Kehadiran Kelas
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Rekap Presensi 30 Hari Terakhir
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
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
                Persentase kehadiran seluruh siswa kelas dalam 30 hari terakhir.
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

          <div className="pt-2 border-t border-slate-200/80 relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{lowAttendanceCount > 0 ? `${lowAttendanceCount} Siswa Presensi < 85%` : "Seluruh Siswa Tertib Hadir"}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(true)}
              className="px-3 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
            >
              Catat Presensi
            </button>
          </div>
        </div>

        {/* ROW 2 - LEFT: Siswa Perlu Perhatian (6 Cols) */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 12% -12%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 block">
                Pemantauan Perilaku Siswa (PR)
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Catatan Observasi &amp; Sikap Belajar di Kelas
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-amber-600 tracking-tight">
                {atensiCount}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Siswa Perlu Perhatian Guru
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
                <span>Kondisi Baik: Seluruh siswa kelas aktif dan tidak ada kendala perilaku yang menonjol.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold relative z-10">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
              Perlu Observasi Khusus
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{kritisCount} Kritis • {waspadaCount} Waspada</span>
          </div>
        </div>

        {/* ROW 2 - RIGHT: Perkembangan Nilai Akademik (6 Cols) */}
        <div
          className="md:col-span-6 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 90% 105%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-800 block">
                Perkembangan Nilai Akademik (AK)
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Rata-rata Nilai Ulangan &amp; Tugas Kelas
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconGraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">
                {classAvgScore}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-700">
                Rata-rata Nilai ({studentsWithScore.length} Siswa Terdata)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {stableScoreCount} siswa nilai tuntas/stabil, {scoreDropCount} siswa mengalami penurunan nilai.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs font-semibold relative z-10 gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/95 px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{scoreDropCount > 0 ? `${scoreDropCount} Siswa Perlu Remedial` : "Nilai Kelas Terpantau Tuntas"}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAcademicModalOpen(true)}
                className="px-3 py-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200/80 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              >
                Catat Nilai
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("NILAI_TURUN")}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Filter</span>
                <IconArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Panel: Balanced 2-Column Desktop Grid */}
      <section
        id="observasi"
        className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)] space-y-6 scroll-mt-24"
      >
        {/* Header with Date Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconAi className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Pencatatan Jurnal Observasi Siswa
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold neo-pill bg-blue-50/80 text-blue-700 border border-white/90">
                  Asisten AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Catat kejadian atau perilaku siswa di kelas untuk memperbarui indikator peringatan dini (EWS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-bold text-slate-600">Tanggal:</span>
            <DatePickerInput
              value={observationDate}
              onChange={setObservationDate}
              size="md"
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
                1. Pilih Nama Siswa:
              </Label>
              <StudentAutocomplete
                students={studentAutocompleteOptions}
                selectedStudent={selectedStudent}
                onSelect={setSelectedStudent}
                placeholder="Ketik nama siswa atau NISN..."
              />
            </div>

            {/* STEP 2: Free Narrative Textarea with AI Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="rawText" className="text-xs sm:text-sm font-bold text-slate-800">
                  2. Catatan Pengamatan Guru:
                </Label>
                <span className="text-xs text-slate-500">
                  Perilaku / kejadian yang diamati di kelas
                </span>
              </div>

              {/* Relative Container for Textarea with AI Button in Bottom Right */}
              <div className="relative rounded-2xl neo-inset bg-[#E7EDF4] p-1 transition-all">
                <Textarea
                  id="rawText"
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Tuliskan catatan pengamatan... Contoh: Siswa terlihat sering melamun dan kurang fokus saat jam pelajaran. Tugas kelompok tidak dikerjakan secara aktif."
                  className="w-full p-4 pb-16 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed border-0 bg-transparent focus:ring-0 focus:outline-none resize-y min-h-[160px]"
                />

                {/* AI Drafting Button */}
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStructureWithAi}
                    className="neo-btn-primary text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <IconMagicWand className="w-4 h-4 text-white" />
                    <span>Bantu Susun Catatan dengan AI</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Parameters & Save Action */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl neo-inset bg-[#E7EDF4] space-y-4 border border-slate-300/40">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 block border-b border-slate-300/60 pb-2">
                3. Skala Indikator Pengamatan (1 - 5):
              </Label>

              {/* Scale 1: Keaktifan */}
              <LinearScale
                label="Keaktifan & Keterlibatan di Kelas"
                description="Keaktifan bertanya, merespon guru, dan kerja kelompok"
                min={1}
                max={5}
                value={participationScore}
                onChange={setParticipationScore}
                minLabel="1 (Pasif / Melamun)"
                midLabel="3 (Cukup Aktif)"
                maxLabel="5 (Sangat Aktif)"
              />

              {/* Scale 2: Ketertiban */}
              <LinearScale
                label="Ketertiban & Kedisiplinan Tugas"
                description="Kesiapan buku/alat tulis dan ketepatan mengumpulkan tugas"
                min={1}
                max={5}
                value={homeworkScore}
                onChange={setHomeworkScore}
                minLabel="1 (Kurang Tertib)"
                midLabel="3 (Cukup Tertib)"
                maxLabel="5 (Sangat Disiplin)"
              />

              {/* Scale 3: Fokus */}
              <LinearScale
                label="Fokus & Konsentrasi Belajar"
                description="Kemampuan memperhatikan materi dan menyerap penjelasan"
                min={1}
                max={5}
                value={quizScore > 5 ? Math.round(quizScore / 20) : (quizScore || 3)}
                onChange={setQuizScore}
                minLabel="1 (Mudah Teralih)"
                midLabel="3 (Cukup Fokus)"
                maxLabel="5 (Sangat Fokus)"
              />
            </div>

            {/* STEP 4: Action Button */}
            <div className="p-4 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-600 leading-snug">
                Catatan akan langsung memperbarui Pilar Perilaku (PR) siswa.
              </p>

              <Button
                type="button"
                onClick={handleManualSave}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-10 px-5 neo-btn-primary disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs"
              >
                <IconSave className="w-4 h-4 text-white" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Catatan Observasi"}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Roster Table Section */}
      <section
        id="rekap"
        className="p-6 sm:p-8 rounded-3xl neo-card space-y-4 scroll-mt-24 border border-white/85 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight">
              Daftar Rekap Siswa &amp; Status 4 Pilar EWS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Data nilai, presensi, dan status pemantauan seluruh siswa kelas {className}.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
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
              <option value="ALL">Semua Status</option>
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
                    Tidak ada data siswa yang cocok dengan filter pencarian.
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

      {/* Daily Class Bulk Attendance Modal */}
      <QuickAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        classNameTitle={className}
        students={studentList}
      />

      {/* Class Bulk Academic Scores Modal */}
      <QuickAcademicModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        classNameTitle={className}
        students={studentList}
        subjects={subjects}
      />

      {/* Observation Save Success Confirmation Modal */}
      <ObservationSuccessModal
        isOpen={Boolean(savedObservationDetail)}
        onClose={() => setSavedObservationDetail(null)}
        onAddAnother={() => {
          setSavedObservationDetail(null)
          setRawText("")
          const formEl = document.getElementById("observasi")
          if (formEl) formEl.scrollIntoView({ behavior: "smooth" })
        }}
        detail={savedObservationDetail}
      />
    </AppLayout>
  )
}
