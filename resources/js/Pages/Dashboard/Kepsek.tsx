import * as React from "react"
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
} from "@/components/ui/storage-icon"
import { Link } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { EwsStatusBadge } from "@/components/ews/EwsStatusBadge"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PriorityStudent {
  id: number
  nis: string
  name: string
  gender: string
  class_name: string
  status: string
  triggers: string[]
  calculated_at: string
}

interface KepsekProps {
  stats?: {
    total_students: number
    normal_count: number
    berisiko_count: number
    waspada_count: number
    kritis_count: number
    data_belum_lengkap_count: number
  }
  priorityStudents?: PriorityStudent[]
  escalatedCases?: any[]
  classes?: any[]
}

export default function Kepsek({ stats, priorityStudents = [], escalatedCases = [], classes = [] }: KepsekProps) {
  const [isDisposed, setIsDisposed] = React.useState(false)

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

  const handleDisposisi = () => {
    setIsDisposed(true)
    toast({
      title: "Disposisi Berhasil Dikirim",
      description: "Instruksi penanganan telah diteruskan ke Koordinator Guru BK dan Wali Kelas terkait.",
      variant: "success",
    })
  }

  return (
    <AppLayout
      currentRole="kepsek"
      activeMenu="dashboard_kepsek"
      title="Ringkasan Eksekutif & Pemantauan EWS"
      subtitle="Navigasi peringatan dini berbasis anomali, iklim belajar sekolah, dan disposisi kasus"
    >
      {/* 2-Row Asymmetric Bento Grid Metrics (Varied Direction Ambient Silhouette Glow) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ROW 1 - LEFT: Large Executive Hero Summary (7 Cols) - Top-Right Glow */}
        <div
          className="md:col-span-7 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-5 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 92% -8%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
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

            <div className="w-12 h-12 rounded-2xl neo-btn text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
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
                  Tersebar di {classes?.length || 3} Rombongan Belajar
                </span>
              </div>
            </div>

            {/* Segmented Visual Status Bar inside neo-inset */}
            <div className="p-4 rounded-2xl neo-inset bg-[#E7EDF4] space-y-3 border border-slate-300/40">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Distribusi Kesehatan 4 Pilar</span>
                <span className="font-semibold text-slate-500">{total} Total Siswa</span>
              </div>

              <div className="h-3 w-full rounded-full bg-slate-200/80 overflow-hidden flex p-0.5 shadow-inner">
                {normalPct > 0 && (
                  <div
                    style={{ width: `${normalPct}%` }}
                    className="h-full rounded-l-full bg-emerald-500 shadow-xs transition-all"
                    title={`Normal: ${normalCount}`}
                  />
                )}
                {berisikoPct > 0 && (
                  <div
                    style={{ width: `${berisikoPct}%` }}
                    className="h-full bg-amber-400 shadow-xs transition-all"
                    title={`Berisiko: ${berisikoCount}`}
                  />
                )}
                {waspadaPct > 0 && (
                  <div
                    style={{ width: `${waspadaPct}%` }}
                    className="h-full bg-orange-500 shadow-xs transition-all"
                    title={`Waspada: ${waspadaCount}`}
                  />
                )}
                {kritisPct > 0 && (
                  <div
                    style={{ width: `${kritisPct}%` }}
                    className="h-full rounded-r-full bg-rose-500 shadow-xs transition-all"
                    title={`Kritis: ${kritisCount}`}
                  />
                )}
                {total === 0 || (normalPct === 0 && berisikoPct === 0 && waspadaPct === 0 && kritisPct === 0) && (
                  <div className="h-full w-full rounded-full bg-slate-300" title="Menunggu Evaluasi" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-700 truncate">Normal: <strong>{normalCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-slate-700 truncate">Risiko: <strong>{berisikoCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-slate-700 truncate">Waspada: <strong>{waspadaCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-rose-600 truncate font-bold">Kritis: {kritisCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1 - RIGHT: Status Normal / Kondisi Sehat (5 Cols) - Right-Center Gauge Glow */}
        <div
          className="md:col-span-5 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 88% 45%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 block">
                Status Normal (Kondusif)
              </span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Zona Hijau &bull; Performa Akademik &amp; Presensi Prima
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
        {/* Card 3: Status Berisiko - Top-Right Glow */}
        <div
          className="md:col-span-4 p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 92% -12%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
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
            <div className="w-10 h-10 rounded-2xl neo-btn text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
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

        {/* Card 4: Status Waspada - Top-Left Glow */}
        <div
          className="md:col-span-4 p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 12% -12%, rgba(249, 115, 22, 0.08) 0%, rgba(238, 242, 247, 0) 45%), #EEF2F7",
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
            <div className="w-10 h-10 rounded-2xl neo-btn text-orange-600 flex items-center justify-center shrink-0 shadow-xs">
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

        {/* Card 5: Status Kritis - Bottom-Right Glow */}
        <div
          className="md:col-span-4 p-6 sm:p-7 rounded-3xl neo-card bg-[#EEF2F7] relative overflow-hidden border border-white/80 flex flex-col justify-between space-y-4 shadow-[5px_5px_12px_rgba(166,178,196,0.38),-5px_-5px_12px_rgba(255,255,255,0.95)]"
          style={{
            background: "radial-gradient(circle at 90% 105%, rgba(244, 63, 94, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
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
            <div className="w-10 h-10 rounded-2xl neo-btn text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
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

      {/* Hero Exception Alert Card */}
      <section
        id="prioritas"
        className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-6 relative overflow-hidden scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neo-btn bg-[#EEF2F7] text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <IconShield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                Peringatan Dini Eksekutif: {priorityStudents.length} Siswa Memerlukan Atensi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Peringatan anomali presensi, nilai akademik, atau perilaku kelas berisiko tinggi
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-bold neo-pill bg-rose-50 text-rose-700 self-start sm:self-auto">
            Prioritas Manajemen
          </span>
        </div>

        {/* Student Anomaly List */}
        {priorityStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {priorityStudents.map((std) => (
              <div key={std.id} className="p-5 sm:p-6 rounded-2xl neo-card-subtle bg-[#EEF2F7] space-y-3.5 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900">{std.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#E6EDF5] text-slate-700">
                      {std.class_name}
                    </span>
                  </div>
                  <EwsStatusBadge status={std.status as any} size="sm" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  <strong className="text-rose-700 font-bold">Faktor Pemicu:</strong> {std.triggers?.join(", ") || "Terdeteksi indikator anomali EWS."}
                </p>
                <div className="pt-3 flex items-center justify-between text-xs sm:text-sm border-t border-slate-200/80">
                  <span className="text-xs text-slate-500 font-medium">NIS: {std.nis}</span>
                  <Link href={`/students/${std.id}`} className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 p-1 rounded-lg hover:bg-blue-50 transition-colors">
                    <span>Lembar Profil 360°</span>
                    <IconChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl neo-inset bg-[#E7EDF4] text-center text-xs sm:text-sm text-slate-500 font-medium">
            Belum ada siswa dengan status kritis atau waspada. Kondisi sekolah saat ini dalam status kondusif.
          </div>
        )}

        {/* Executive Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-300/40">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Sistem EWS merekomendasikan konferensi kasus bersama wali murid dan tim konselor BK.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={priorityStudents.length > 0 ? `/students/${priorityStudents[0].id}` : "/students/1"}
              className="flex-1 sm:flex-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl neo-btn bg-[#EEF2F7] text-slate-800 flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <IconAi className="w-4 h-4 text-blue-600" />
              <span>Analisis AI Advisor</span>
            </Link>

            <Button
              type="button"
              onClick={handleDisposisi}
              disabled={isDisposed}
              className={cn(
                "flex-1 sm:flex-none text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all",
                isDisposed
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "neo-btn-primary text-white"
              )}
            >
              {isDisposed ? (
                <>
                  <IconCheck className="w-4 h-4" />
                  <span>Telah Didisposisikan</span>
                </>
              ) : (
                <>
                  <IconArrowRight className="w-4 h-4" />
                  <span>Disposisikan ke Tim Guru BK</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Analytical Visualizations Row */}
      <div id="analitik" className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 scroll-mt-20">
        {/* Left Chart Card: Academic & Attendance Health Trend */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Tren Iklim Kehadiran &amp; Akademik Semester
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Stabil Positif
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Rata-rata kumulatif mingguan vs Garis Ambang Batas KKM (75.0)
              </p>
            </div>
            <IconTrendUp className="w-5 h-5 text-emerald-600" />
          </div>

          {/* SVG Smooth Curve Line Chart */}
          <div className="p-5 rounded-2xl neo-inset bg-[#E7EDF4] space-y-3">
            <div className="h-48 w-full relative">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#CBD5E1" strokeDasharray="4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#CBD5E1" strokeDasharray="4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#CBD5E1" strokeDasharray="4" />

                {/* KKM Threshold Line (75.0) */}
                <line x1="0" y1="75" x2="500" y2="75" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6" opacity="0.7" />
                <text x="440" y="70" fill="#f43f5e" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  KKM (75)
                </text>

                {/* Attendance Trend Curve (Emerald) */}
                <path
                  d="M 10 30 Q 100 20, 200 25 T 350 22 T 490 18"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Academic Score Curve (Blue) */}
                <path
                  d="M 10 90 Q 100 65, 200 60 T 350 50 T 490 42"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="10" cy="90" r="4" fill="#2563EB" />
                <circle cx="200" cy="60" r="4" fill="#2563EB" />
                <circle cx="350" cy="50" r="4" fill="#2563EB" />
                <circle cx="490" cy="42" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />

                <circle cx="490" cy="18" r="5" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-2.5 border-t border-slate-300/60">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span className="text-slate-800 font-semibold">Presensi (97.4%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-slate-800 font-semibold">Nilai Akademik (79.2)</span>
                </div>
              </div>

              <span className="text-slate-500 text-xs font-semibold">Pekan 1 - 4</span>
            </div>
          </div>
        </div>

        {/* Right Chart Card: Risk Distribution Semi-Donut */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-slate-200/80 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Distribusi Status EWS Sekolah
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Proporsi kesehatan iklim {total} siswa terdaftar</p>
            </div>
            <IconPieChart className="w-5 h-5 text-slate-400" />
          </div>

          {/* Semi Donut Breakdown */}
          <div className="p-5 rounded-2xl neo-inset bg-[#E7EDF4] flex flex-col items-center justify-center space-y-3">
            <div className="relative w-44 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#ECFDF5"
                  strokeWidth="14"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 80 20"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="14"
                  strokeDasharray="110"
                />
                <path
                  d="M 80 20 A 40 40 0 0 1 88 35"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="14"
                />
                <path
                  d="M 88 35 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="14"
                />
              </svg>

              <div className="absolute bottom-1 text-center">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{normalPct}%</span>
                <span className="block text-xs font-bold text-emerald-700 uppercase">Kondusif</span>
              </div>
            </div>

            {/* Legend Grid with Dynamic Counts */}
            <div className="w-full grid grid-cols-2 gap-2.5 text-xs sm:text-sm pt-2.5 border-t border-slate-300/60 font-medium">
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
                  title: "Laporan Sedang Diunduh",
                  description: "Format PDF Eksekutif E-Jurnal STIKMAS sedang diexport.",
                  variant: "success",
                })
              }}
              className="w-full h-11 neo-btn text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <IconSpreadsheet className="w-4 h-4 text-slate-600" />
              <span>Unduh Laporan Eksekutif (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
