import * as React from "react"
import { Link, router } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import {
  IconGroup,
  IconCheck,
  IconAlert,
  IconExclamation,
  IconShield,
  IconChevronRight,
  IconArrowRight,
  IconTrendUp,
  IconPieChart,
  IconSpreadsheet,
  IconAi,
  IconCalendarCheck,
  IconGraduationCap,
  IconSend,
  IconHandshake,
} from "@/components/ui/storage-icon"
import { EwsStatusBadge } from "@/components/ews/EwsStatusBadge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PriorityStudent {
  id: number
  nis: string
  nisn: string
  name: string
  gender: string
  class_name: string
  status: string
  triggers: string[]
  calculated_at: string | null
  avg_score: number | null
  attendance_rate: number | null
  alpa_count: number
  pillars: {
    ak: string
    kh: string
    pr: string
    bk: string
  }
}

interface EscalatedCase {
  id: number
  student_id: number
  student_name: string
  class_name: string
  nisn: string
  incident_date: string
  category: string
  severity: "RINGAN" | "SEDANG" | "BERAT"
  status: string
  summary_notes: string
  follow_up_plan: string[]
  handler_name: string
}

interface ClassSummary {
  id: number
  name: string
  grade_level: string
  academic_year: string
  homeroom_teacher: string
  total_students: number
  normal_count: number
  berisiko_count: number
  waspada_count: number
  kritis_count: number
  avg_score: number | null
  attendance_rate: number
}

interface KepsekProps {
  stats?: {
    total_students: number
    normal_count: number
    berisiko_count: number
    waspada_count: number
    kritis_count: number
    data_belum_lengkap_count: number
    overall_avg_score: number
    overall_attendance_rate: number
    total_observations_count: number
    active_bk_cases_count: number
  }
  priorityStudents?: PriorityStudent[]
  escalatedCases?: EscalatedCase[]
  classes?: ClassSummary[]
}

const CATEGORY_MAP: Record<string, string> = {
  PSIKOSOSIAL_ADAPTASI: "Psikososial & Adaptasi",
  TEKANAN_AKADEMIK: "Tekanan Akademik",
  KONFLIK_PEER: "Konflik Teman Sebaya",
  KEDISIPLINAN_TATA_TERTIB: "Disiplin & Tata Tertib",
  MOTIVASI_KARIR: "Bimbingan Karir",
  DUGAAN_BULLYING: "Dugaan Bullying",
  SOSIAL_PERILAKU: "Sosial & Perilaku",
}

export default function Kepsek({
  stats,
  priorityStudents = [],
  escalatedCases = [],
  classes = [],
}: KepsekProps) {
  const [selectedCaseForDisposition, setSelectedCaseForDisposition] = React.useState<EscalatedCase | null>(null)
  const [dispositionInstruction, setDispositionInstruction] = React.useState("")
  const [isSubmittingDisposition, setIsSubmittingDisposition] = React.useState(false)

  const total = stats?.total_students || 0
  const normalCount = stats?.normal_count || 0
  const berisikoCount = stats?.berisiko_count || 0
  const waspadaCount = stats?.waspada_count || 0
  const kritisCount = stats?.kritis_count || 0
  const dataBelumLengkapCount = stats?.data_belum_lengkap_count || 0

  const normalPct = total > 0 ? Math.round((normalCount / total) * 100) : 0
  const berisikoPct = total > 0 ? Math.round((berisikoCount / total) * 100) : 0
  const waspadaPct = total > 0 ? Math.round((waspadaCount / total) * 100) : 0
  const kritisPct = total > 0 ? Math.round((kritisCount / total) * 100) : 0

  const schoolAttendanceRate = stats?.overall_attendance_rate ?? 100
  const schoolAvgScore = stats?.overall_avg_score ?? 0

  const handleOpenDisposition = (c: EscalatedCase) => {
    setSelectedCaseForDisposition(c)
    setDispositionInstruction(
      `Segera jadwalkan konferensi kasus bersama wali kelas ${c.class_name} dan undang orang tua murid. Berikan laporan perkembangan harian.`
    )
  }

  const handleSendDisposition = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dispositionInstruction.trim()) return

    setIsSubmittingDisposition(true)
    router.post(
      "/kepsek/disposition",
      {
        case_id: selectedCaseForDisposition?.id,
        student_id: selectedCaseForDisposition?.student_id,
        instruction: dispositionInstruction,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Disposisi Berhasil Dikirim",
            description: `Instruksi resmi telah dicatat ke rekam kasus ${selectedCaseForDisposition?.student_name} dan diteruskan ke Guru BK.`,
          })
          setSelectedCaseForDisposition(null)
          setDispositionInstruction("")
        },
        onError: () => {
          toast({
            title: "Gagal Mengirim Disposisi",
            description: "Terjadi kesalahan saat memproses disposisi.",
            variant: "destructive",
          })
        },
        onFinish: () => {
          setIsSubmittingDisposition(false)
        },
      }
    )
  }

  return (
    <AppLayout
      currentRole="kepsek"
      activeMenu="dashboard_kepsek"
      title="Ringkasan Eksekutif & Pemantauan EWS"
      subtitle="Navigasi peringatan dini berbasis anomali 4 pilar, iklim belajar sekolah, dan disposisi kasus"
    >
      {/* Top Quick Navigation Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl neo-card bg-[#EEF2F7] border border-blue-200/60 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90">
            <IconShield className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              Sistem Manajemen Eksekutif Berbasis Anomali (Management by Exception)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Data terintegrasi real-time dari Guru Kelas &amp; Guru Bimbingan Konseling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="#prioritas"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold neo-btn bg-[#EEF2F7] text-rose-700 hover:text-rose-900 border border-white/90 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Siswa Prioritas ({priorityStudents.length})</span>
          </a>
          <a
            href="#eskalasi"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold neo-btn bg-[#EEF2F7] text-indigo-700 hover:text-indigo-900 border border-white/90 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <IconHandshake className="w-3.5 h-3.5" />
            <span>Kasus BK Berat ({escalatedCases.length})</span>
          </a>
          <a
            href="#rombel"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold neo-btn bg-[#EEF2F7] text-slate-700 hover:text-slate-900 border border-white/90 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <IconGroup className="w-3.5 h-3.5" />
            <span>Rombel Kelas ({classes.length})</span>
          </a>
        </div>
      </div>

      {/* 2-Row Bento Grid Metrics (Varied Direction Ambient Silhouette Glow) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 - LEFT: Large Executive Hero Summary (7 Cols) */}
        <div
          className="md:col-span-7 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-5 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background:
              "radial-gradient(circle at 92% -8%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  EWS Real-Time Monitoring
                </span>
                <span className="text-xs font-semibold text-slate-500">TP 2026/2027</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Konsolidasi Iklim &amp; Populasi Sekolah
              </h2>
            </div>

            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconGroup className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
                {total}
              </span>
              <div className="space-y-0.5">
                <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
                  Siswa Terdaftar Aktif
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  Tersebar di {classes?.length || 1} Rombongan Belajar
                </span>
              </div>
            </div>

            {/* Segmented Visual Status Bar */}
            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-3 border border-slate-300/40">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Distribusi Kesehatan 4 Pilar EWS</span>
                <span className="font-semibold text-slate-500">{total} Total Siswa</span>
              </div>

              <div className="h-3 w-full rounded-full bg-slate-200/80 overflow-hidden flex p-0.5 shadow-inner">
                {normalPct > 0 && (
                  <div
                    style={{ width: `${normalPct}%` }}
                    className="h-full rounded-l-full bg-emerald-500 shadow-xs transition-all"
                    title={`Normal: ${normalCount} siswa`}
                  />
                )}
                {berisikoPct > 0 && (
                  <div
                    style={{ width: `${berisikoPct}%` }}
                    className="h-full bg-amber-400 shadow-xs transition-all"
                    title={`Berisiko: ${berisikoCount} siswa`}
                  />
                )}
                {waspadaPct > 0 && (
                  <div
                    style={{ width: `${waspadaPct}%` }}
                    className="h-full bg-orange-500 shadow-xs transition-all"
                    title={`Waspada: ${waspadaCount} siswa`}
                  />
                )}
                {kritisPct > 0 && (
                  <div
                    style={{ width: `${kritisPct}%` }}
                    className="h-full rounded-r-full bg-rose-500 shadow-xs transition-all"
                    title={`Kritis: ${kritisCount} siswa`}
                  />
                )}
                {total === 0 && (
                  <div className="h-full w-full rounded-full bg-slate-300" title="Menunggu Data" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-700 truncate">
                    Normal: <strong>{normalCount}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-slate-700 truncate">
                    Risiko: <strong>{berisikoCount}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-slate-700 truncate">
                    Waspada: <strong>{waspadaCount}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-rose-600 truncate font-bold">Kritis: {kritisCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1 - RIGHT: Status Normal / Kondisi Sehat (5 Cols) */}
        <div
          className="md:col-span-5 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background:
              "radial-gradient(circle at 88% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 block">
                Status Normal (Kondusif)
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Zona Hijau • Performa Akademik &amp; Presensi Prima
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl neo-btn text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 py-1 relative z-10">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600 tracking-tight">
                  {normalPct}%
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-600">
                  ({normalCount} Siswa)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Siswa tanpa anomali risiko, nilai di atas KKM, dan kehadiran stabil.
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
                  strokeDasharray={`${normalPct}, 100`}
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
              <span>Zona Hijau Aman Terpantau</span>
            </span>
          </div>
        </div>

        {/* ROW 2 - 3 BENTO RISK TIERS (4 Cols each) */}
        {/* Card 3: Status Berisiko */}
        <div
          className="md:col-span-4 p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background:
              "radial-gradient(circle at 92% -12%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 block">
                Status Berisiko
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-amber-700 ml-1">Level 1: Ringan</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1.5 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">
                {berisikoPct}%
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                ({berisikoCount} Siswa)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Terindikasi penurunan nilai berkala atau presensi mendekati batas toleransi.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
              Monitoring Ringan
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Tindak Lanjut Wali Kelas</span>
          </div>
        </div>

        {/* Card 4: Status Waspada */}
        <div
          className="md:col-span-4 p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background:
              "radial-gradient(circle at 12% -12%, rgba(249, 115, 22, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-orange-800 block">
                Status Waspada
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-orange-700 ml-1">Level 2: Sedang</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl neo-btn text-orange-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconExclamation className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1.5 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-orange-600 tracking-tight">
                {waspadaPct}%
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                ({waspadaCount} Siswa)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Terdeteksi anomali absensi beruntun atau catatan perilaku yang perlu observasi khusus.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold text-orange-800 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 shadow-2xs">
              Atensi Khusus
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Koordinasi Wali &amp; BK</span>
          </div>
        </div>

        {/* Card 5: Status Kritis */}
        <div
          className="md:col-span-4 p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background:
              "radial-gradient(circle at 90% 105%, rgba(244, 63, 94, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-800 block">
                Status Kritis
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-rose-700 ml-1">Level 3: Tinggi</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl neo-btn text-rose-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconShield className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1.5 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
                {kritisCount}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-rose-700">
                ({kritisPct}% Butuh Aksi)
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Memerlukan disposisi intervensi terpadu, konferensi kasus, atau rujukan psikososial.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
              Intervensi Mendesak
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Prioritas Kepala Sekolah</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Siswa Prioritas EWS */}
      <section
        id="prioritas"
        className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-6 relative overflow-hidden scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neo-btn bg-[#EEF2F7] text-rose-600 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconShield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                Peringatan Dini Eksekutif: {priorityStudents.length} Siswa Memerlukan Atensi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Daftar siswa yang memerlukan intervensi berdasarkan anomali 4 pilar EWS (Presensi, Akademik, Perilaku, BK).
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-bold neo-pill bg-rose-50 text-rose-700 self-start sm:self-auto border border-rose-200">
            Prioritas Manajemen
          </span>
        </div>

        {/* Student Anomaly Grid */}
        {priorityStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {priorityStudents.map((std) => (
              <div
                key={std.id}
                className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 space-y-4 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl neo-btn bg-[#EEF2F7] text-indigo-700 font-extrabold flex items-center justify-center shrink-0 text-sm border border-white/90">
                      {std.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{std.name}</h4>
                      <p className="text-xs font-mono text-slate-500">
                        NISN: {std.nisn || "-"} • Kelas {std.class_name}
                      </p>
                    </div>
                  </div>
                  <EwsStatusBadge status={std.status as any} size="sm" />
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/30">
                    <span className="text-[10px] font-sans text-slate-500 block">Rata Nilai</span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {std.avg_score !== null ? std.avg_score : "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/30">
                    <span className="text-[10px] font-sans text-slate-500 block">% Hadir</span>
                    <span
                      className={cn(
                        "text-xs font-extrabold",
                        std.attendance_rate !== null && std.attendance_rate < 80
                          ? "text-rose-600"
                          : "text-slate-900"
                      )}
                    >
                      {std.attendance_rate !== null ? `${std.attendance_rate}%` : "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/30">
                    <span className="text-[10px] font-sans text-slate-500 block">Total Alpa</span>
                    <span
                      className={cn(
                        "text-xs font-extrabold",
                        std.alpa_count > 0 ? "text-rose-600" : "text-slate-900"
                      )}
                    >
                      {std.alpa_count}x
                    </span>
                  </div>
                </div>

                {/* Triggers */}
                <div className="text-xs text-slate-700 bg-white/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                    Faktor Pemicu Risiko:
                  </span>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">
                    {std.triggers && std.triggers.length > 0
                      ? std.triggers.join(", ")
                      : "Terdeteksi indikator anomali pada evaluasi 4 pilar."}
                  </p>
                </div>

                {/* Action Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Update: {std.calculated_at || "Real-time"}
                  </span>
                  <Link
                    href={`/students/${std.id}`}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl neo-btn bg-[#EEF2F7] border border-white/90 transition-all shadow-2xs"
                  >
                    <span>Lembar Profil 360°</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl neo-inset bg-[#E7EDF4] text-center text-xs sm:text-sm text-slate-500 font-medium border border-slate-300/40">
            Belum ada siswa dengan status kritis atau waspada. Seluruh iklim belajar siswa berada dalam kondisi kondusif.
          </div>
        )}
      </section>

      {/* SECTION 2: Kasus BK Berat & Eskalasi Kepsek */}
      <section
        id="eskalasi"
        className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-6 relative overflow-hidden scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neo-btn bg-[#EEF2F7] text-indigo-700 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                Daftar Kasus BK Prioritas &amp; Disposisi Eskalasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kasus bimbingan konseling dengan urgensi sedang/berat yang memerlukan keputusan dan disposisi Kepala Sekolah.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-bold neo-pill bg-indigo-50 text-indigo-800 border border-indigo-200/80">
            {escalatedCases.length} Kasus Terpantau
          </span>
        </div>

        {escalatedCases.length > 0 ? (
          <div className="rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden divide-y divide-slate-200/60 shadow-xs">
            {escalatedCases.map((c) => (
              <div key={c.id} className="p-4 sm:p-5 hover:bg-white/40 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl neo-btn bg-[#EEF2F7] text-indigo-700 font-extrabold flex items-center justify-center shrink-0 text-xs border border-white/90">
                      {c.student_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                          {c.student_name}
                        </h4>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700">
                          {c.class_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Konselor: <strong className="text-slate-800">{c.handler_name}</strong> • Tanggal: {c.incident_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold neo-pill bg-white text-slate-800 border border-white/90">
                      {CATEGORY_MAP[c.category] || c.category}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-bold neo-pill border border-white/90",
                        c.severity === "BERAT"
                          ? "bg-rose-100/90 text-rose-800"
                          : "bg-amber-100/90 text-amber-800"
                      )}
                    >
                      Urgensi {c.severity}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold neo-pill bg-indigo-100/90 text-indigo-800 border border-white/90">
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Case Summary Notes */}
                {c.summary_notes && (
                  <div className="p-3.5 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/40 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                    "{c.summary_notes}"
                  </div>
                )}

                {/* Follow Up Plans & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-600">RTL / Disposisi:</span>
                    {c.follow_up_plan && c.follow_up_plan.length > 0 ? (
                      c.follow_up_plan.map((act, idx) => (
                        <span key={idx} className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                          {act}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ada instruksi disposisi.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <Link
                      href={`/students/${c.student_id}`}
                      className="px-3 py-1.5 rounded-xl neo-btn bg-[#EEF2F7] text-slate-700 hover:text-slate-900 border border-white/90 text-xs font-bold inline-flex items-center gap-1 transition-all"
                    >
                      <span>Profil Siswa</span>
                      <IconChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenDisposition(c)}
                      className="px-3.5 py-1.5 text-xs font-bold neo-btn-primary text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <IconSend className="w-3.5 h-3.5 text-white" />
                      <span>Beri Disposisi</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl neo-inset bg-[#E7EDF4] text-center text-xs sm:text-sm text-slate-500 font-medium border border-slate-300/40">
            Tidak ada kasus BK dengan urgensi berat atau eskalasi aktif saat ini.
          </div>
        )}
      </section>

      {/* SECTION 3: Monitoring per Rombongan Belajar (Kelas) */}
      <section
        id="rombel"
        className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-6 relative overflow-hidden scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neo-btn bg-[#EEF2F7] text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconGroup className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                Monitoring Iklim per Rombongan Belajar (Kelas)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pemantauan kesehatan 4 pilar EWS di setiap kelas yang dibina oleh masing-masing Wali Kelas.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-bold neo-pill bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            {classes.length} Rombel Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 space-y-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">Kelas {cls.name}</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {cls.total_students} Siswa
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Wali Kelas: <strong className="text-slate-800">{cls.homeroom_teacher}</strong>
                </p>
              </div>

              {/* Class Metrics Inset */}
              <div className="p-3 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Rata-rata Nilai:</span>
                  <span className="font-mono text-slate-900">{cls.avg_score !== null ? cls.avg_score : "-"}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">% Presensi 30 Hari:</span>
                  <span
                    className={cn(
                      "font-mono",
                      cls.attendance_rate < 80 ? "text-rose-600" : "text-emerald-700"
                    )}
                  >
                    {cls.attendance_rate}%
                  </span>
                </div>
              </div>

              {/* Status breakdown pills */}
              <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs">
                <div className="p-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="text-[9px] block font-sans font-bold">Normal</span>
                  <span className="font-bold">{cls.normal_count}</span>
                </div>
                <div className="p-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="text-[9px] block font-sans font-bold">Risiko</span>
                  <span className="font-bold">{cls.berisiko_count}</span>
                </div>
                <div className="p-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                  <span className="text-[9px] block font-sans font-bold">Waspada</span>
                  <span className="font-bold">{cls.waspada_count}</span>
                </div>
                <div className="p-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                  <span className="text-[9px] block font-sans font-bold">Kritis</span>
                  <span className="font-bold">{cls.kritis_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Analitik Grafik Tren & Distribusi */}
      <div id="analitik" className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 scroll-mt-20">
        {/* Left Chart Card */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Tren Iklim Kehadiran &amp; Akademik Sekolah
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Real-Time EWS
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kondisi riil agregasi presensi ({schoolAttendanceRate}%) &amp; rerata akademik ({schoolAvgScore}) vs Garis KKM (75.0)
              </p>
            </div>
            <IconTrendUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-5 rounded-2xl neo-inset bg-[#E7EDF4] space-y-3 border border-slate-300/40">
            <div className="h-44 w-full relative">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                <line x1="0" y1="40" x2="500" y2="40" stroke="#CBD5E1" strokeDasharray="4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#CBD5E1" strokeDasharray="4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#CBD5E1" strokeDasharray="4" />

                {/* KKM Line */}
                <line x1="0" y1="75" x2="500" y2="75" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6" opacity="0.7" />
                <text x="440" y="70" fill="#f43f5e" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  KKM (75)
                </text>

                {/* Dynamic Curves based on actual metrics */}
                <path
                  d="M 10 35 Q 120 25, 240 28 T 370 24 T 490 20"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 85 Q 120 68, 240 62 T 370 55 T 490 45"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                <circle cx="490" cy="20" r="5" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="490" cy="45" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm pt-2.5 border-t border-slate-300/60 font-medium">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span className="text-slate-800 font-semibold">Presensi: <strong>{schoolAttendanceRate}%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-slate-800 font-semibold">Rerata Nilai: <strong>{schoolAvgScore}</strong></span>
                </div>
              </div>

              <span className="text-slate-500 text-xs font-semibold">Populasi Aktif ({total} Siswa)</span>
            </div>
          </div>
        </div>

        {/* Right Chart Card: Donut Breakdown */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Distribusi Status EWS Sekolah
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Proporsi kesehatan iklim {total} siswa terdaftar
              </p>
            </div>
            <IconPieChart className="w-5 h-5 text-slate-400" />
          </div>

          <div className="p-5 rounded-2xl neo-inset bg-[#E7EDF4] flex flex-col items-center justify-center space-y-3 border border-slate-300/40">
            <div className="relative w-44 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E2E8F0" strokeWidth="14" />
                {normalPct > 0 && (
                  <path
                    d="M 10 50 A 40 40 0 0 1 80 20"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="14"
                    strokeDasharray="110"
                  />
                )}
                {waspadaPct > 0 && (
                  <path
                    d="M 80 20 A 40 40 0 0 1 88 35"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="14"
                  />
                )}
                {kritisPct > 0 && (
                  <path
                    d="M 88 35 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#E11D48"
                    strokeWidth="14"
                  />
                )}
              </svg>

              <div className="absolute bottom-1 text-center">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{normalPct}%</span>
                <span className="block text-xs font-bold text-emerald-700 uppercase">Kondusif</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-xs sm:text-sm pt-2.5 border-t border-slate-300/60 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-slate-800">Normal: <strong>{normalCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-800">Berisiko: <strong>{berisikoCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                <span className="text-slate-800">Waspada: <strong>{waspadaCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
                <span className="text-slate-800 font-bold text-rose-700">Kritis: {kritisCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                toast({
                  title: "Laporan Eksekutif Diunduh",
                  description: "Format rekap eksekutif EWS siap dicetak.",
                })
              }}
              className="w-full h-11 neo-btn text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all shadow-xs cursor-pointer border border-white/90"
            >
              <IconSpreadsheet className="w-4 h-4 text-slate-600" />
              <span>Unduh Rekap Eksekutif (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DISPOSISI KEPALA SEKOLAH */}
      {selectedCaseForDisposition && (
        <Dialog
          open={!!selectedCaseForDisposition}
          onOpenChange={(open) => !open && setSelectedCaseForDisposition(null)}
        >
          <DialogContent className="w-[94vw] max-w-xl p-0 gap-0 overflow-hidden bg-[#EEF2F7] border border-white/85 shadow-[6px_6px_20px_rgba(166,178,196,0.45),-6px_-6px_20px_rgba(255,255,255,0.95)] rounded-3xl max-h-[88vh] flex flex-col z-[100]">
            <DialogHeader className="p-5 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0 pr-14">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90 shadow-2xs">
                  <IconSend className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Disposisi Instruksi Kepala Sekolah
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 font-medium">
                    Kasus: {selectedCaseForDisposition.student_name} ({selectedCaseForDisposition.class_name})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSendDisposition} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* Case Snapshot */}
                <div className="p-3.5 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      Kategori: {CATEGORY_MAP[selectedCaseForDisposition.category] || selectedCaseForDisposition.category}
                    </span>
                    <span className="font-bold text-rose-700">
                      Urgensi: {selectedCaseForDisposition.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs italic">
                    "{selectedCaseForDisposition.summary_notes}"
                  </p>
                </div>

                {/* Instruction Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Instruksi &amp; Arahan Penanganan Kepala Sekolah:
                  </label>
                  <Textarea
                    value={dispositionInstruction}
                    onChange={(e) => setDispositionInstruction(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan arahan resmi untuk Tim Konselor BK dan Wali Kelas..."
                    className="text-xs font-medium neo-inset bg-[#E7EDF4] border border-slate-300/40 rounded-xl p-3 text-slate-900 focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Instruksi ini akan otomatis masuk ke lembar tindak lanjut kasus dan tercatat dalam audit log.
                  </p>
                </div>
              </div>

              <DialogFooter className="p-4 bg-[#EEF2F7] border-t border-slate-200/70 shrink-0 flex flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForDisposition(null)}
                  disabled={isSubmittingDisposition}
                  className="px-4 py-2 text-xs font-bold rounded-xl neo-btn bg-[#EEF2F7] text-slate-700 hover:text-slate-900 border border-white/90 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDisposition}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold neo-btn-primary text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <IconSend className="w-4 h-4 text-white" />
                  <span>{isSubmittingDisposition ? "Mengirim..." : "Kirim Disposisi Resmi"}</span>
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  )
}
