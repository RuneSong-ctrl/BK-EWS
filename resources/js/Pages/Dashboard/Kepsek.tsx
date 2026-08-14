import * as React from "react"
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  Check,
} from "lucide-react"
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

export default function Kepsek({ stats, priorityStudents = [], escalatedCases = [] }: KepsekProps) {
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
      {/* Top 5 Executive Metric Cards - Scaled for 14"-16" screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl neo-card flex flex-col justify-between h-[120px]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Siswa Terdata
          </span>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {total}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Siswa Terdaftar</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl neo-card flex flex-col justify-between h-[120px]">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Status Normal
          </span>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight font-mono">
              {normalPct}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{normalCount} Siswa Kondusif</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl neo-card flex flex-col justify-between h-[120px]">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Status Berisiko
          </span>
          <div>
            <div className="text-3xl font-extrabold text-amber-600 tracking-tight font-mono">
              {berisikoPct}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{berisikoCount} Siswa Terpantau</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl neo-card flex flex-col justify-between h-[120px]">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Status Waspada
          </span>
          <div>
            <div className="text-3xl font-extrabold text-orange-600 tracking-tight font-mono">
              {waspadaPct}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{waspadaCount} Siswa Atensi</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl neo-card flex flex-col justify-between h-[120px]">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Status Kritis
          </span>
          <div>
            <div className="text-3xl font-extrabold text-rose-600 tracking-tight font-mono">
              {kritisCount}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{kritisPct}% Butuh Intervensi</p>
          </div>
        </div>
      </div>

      {/* Hero Exception Alert Card */}
      <section
        id="prioritas"
        className="p-6 sm:p-8 rounded-3xl neo-card space-y-5 relative overflow-hidden scroll-mt-20 border border-rose-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Peringatan Dini Eksekutif: {priorityStudents.length} Siswa Memerlukan Atensi
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Peringatan aktif pemicu presensi, nilai akademik, atau anomali perilaku
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto">
            Prioritas Manajemen
          </span>
        </div>

        {/* Student Anomaly List */}
        {priorityStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityStudents.map((std) => (
              <div key={std.id} className="p-4 sm:p-5 rounded-2xl neo-card-subtle bg-[#EEF2F7] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900">{std.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{std.class_name}</span>
                  </div>
                  <EwsStatusBadge status={std.status as any} size="sm" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-rose-700 font-bold">Pemicu:</strong> {std.triggers?.join(", ") || "Terdeteksi indikator anomali EWS."}
                </p>
                <div className="pt-2.5 flex items-center justify-between text-xs sm:text-sm border-t border-slate-200/80">
                  <span className="text-xs text-slate-500">NIS: {std.nis}</span>
                  <Link href={`/students/${std.id}`} className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <span>Profil 360°</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl neo-inset text-center text-xs sm:text-sm text-slate-500">
            Belum ada siswa dengan status kritis atau waspada. Kondisi sekolah saat ini dalam status kondusif.
          </div>
        )}

        {/* Executive Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-rose-100">
          <p className="text-xs sm:text-sm text-slate-600">
            Sistem EWS merekomendasikan konferensi kasus bersama wali murid dan tim konselor BK.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/students/1"
              className="flex-1 sm:flex-none text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Analisis AI Advisor</span>
            </Link>

            <Button
              type="button"
              onClick={handleDisposisi}
              disabled={isDisposed}
              className={cn(
                "flex-1 sm:flex-none text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm",
                isDisposed
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white"
              )}
            >
              {isDisposed ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Telah Didisposisikan</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
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
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Tren Iklim Kehadiran &amp; Akademik Semester
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Stabil Positif
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Rata-rata kumulatif mingguan vs Garis Ambang Batas KKM (75.0)
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          {/* SVG Smooth Curve Line Chart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="h-48 w-full relative">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#E2E8F0" strokeDasharray="4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#E2E8F0" strokeDasharray="4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#E2E8F0" strokeDasharray="4" />

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
            <div className="flex items-center justify-between text-xs sm:text-sm pt-2.5 border-t border-slate-200">
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

              <span className="text-slate-500 font-mono text-xs">Pekan 1 - 4</span>
            </div>
          </div>
        </div>

        {/* Right Chart Card: Risk Distribution Semi-Donut */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Distribusi Status EWS Sekolah
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Proporsi kesehatan iklim 1.248 siswa</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-slate-400" />
          </div>

          {/* Semi Donut Breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center space-y-3">
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
                <span className="text-2xl font-bold font-mono text-slate-900">88%</span>
                <span className="block text-xs font-bold text-emerald-700 uppercase">Kondusif</span>
              </div>
            </div>

            {/* Legend Grid */}
            <div className="w-full grid grid-cols-2 gap-2.5 text-xs sm:text-sm pt-2.5 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-slate-800">Normal: <strong>1.098</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-800">Berisiko: <strong>100</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-slate-800">Waspada: <strong>38</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span className="text-slate-800 font-bold text-rose-700">Kritis: 2</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                toast({
                  title: "Laporan Sedang Diunduh",
                  description: "Format PDF Eksekutif BK-EWS sedang diexport.",
                })
              }}
              className="w-full h-11 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Unduh Laporan Eksekutif (PDF)</span>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
