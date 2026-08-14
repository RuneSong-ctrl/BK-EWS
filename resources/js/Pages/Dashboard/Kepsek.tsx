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

export default function Kepsek() {
  const [isDisposed, setIsDisposed] = React.useState(false)

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
      activeMenu="dashboard"
      title="Dashboard Eksekutif Kepala Sekolah"
      subtitle="Navigasi berbasis anomali (exception-based), pemantauan kesehatan iklim sekolah, dan peringatan dini"
    >
      {/* Top 5 Executive Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Siswa
          </span>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              1.248
            </div>
            <p className="text-[11px] text-slate-500">Seluruh Jenjang (36 Kelas)</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Status Normal
          </span>
          <div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight font-mono">
              88%
            </div>
            <p className="text-[11px] text-slate-500">1.098 Siswa Kondusif</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Status Berisiko
          </span>
          <div>
            <div className="text-2xl font-bold text-amber-700 tracking-tight font-mono">
              8%
            </div>
            <p className="text-[11px] text-slate-500">100 Siswa Terpantau</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[104px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
            Status Waspada
          </span>
          <div>
            <div className="text-2xl font-bold text-orange-700 tracking-tight font-mono">
              3%
            </div>
            <p className="text-[11px] text-slate-500">38 Siswa Intervensi</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[104px] ring-2 ring-rose-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            Status Kritis
          </span>
          <div>
            <div className="text-2xl font-bold text-rose-700 tracking-tight font-mono">
              1%
            </div>
            <p className="text-[11px] text-rose-600 font-semibold">2 Siswa Butuh Tindakan</p>
          </div>
        </div>
      </div>

      {/* Hero Exception Alert Card (Crimson Left Accent) */}
      <section className="p-6 rounded-3xl neo-card bg-gradient-to-r from-rose-50/90 via-white to-white border-l-8 border-rose-500 border-t border-r border-b border-rose-100 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Peringatan Dini Eksekutif: 2 Siswa Berstatus Kritis Membutuhkan Penanganan Segera
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Melewati ambang batas bahaya (&gt;5 Hari Alpa Beruntun atau Kasus Pelanggaran Berat)
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Prioritas Manajemen
          </span>
        </div>

        {/* Student Anomaly List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl neo-card-subtle bg-white/90 border border-rose-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Dimas Pratama</span>
                <span className="text-xs text-slate-500 font-mono">(#SUBJ-1042 &bull; 11-IPS-2)</span>
              </div>
              <EwsStatusBadge status="KRITIS" size="sm" />
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-rose-700 font-semibold">Anomali:</strong> Alpa 4 hari berturut-turut, nilai UTS rata-rata anjlok ke 54 (turun 2 periode), dan indikasi disengagement kelompok.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Wali: Dra. Siti Rahmawati</span>
              <Link href="/students/5" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                <span>Profil 360°</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl neo-card-subtle bg-white/90 border border-rose-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Reza Mahendra</span>
                <span className="text-xs text-slate-500 font-mono">(#SUBJ-8821 &bull; 10-MIPA-3)</span>
              </div>
              <EwsStatusBadge status="KRITIS" size="sm" />
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-rose-700 font-semibold">Anomali:</strong> Pelanggaran tata tertib kategori berat terdaftar di lembar BK, penolakan mediasi peer konselor.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Konselor: Budi Pratama, M.Kons</span>
              <Link href="/students/7" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                <span>Profil 360°</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Executive Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-rose-100">
          <p className="text-xs text-slate-600">
            AI EWS merekomendasikan konferensi kasus bersama orang tua dan penjadwalan konseling darurat.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/students/1"
              className="flex-1 sm:flex-none text-xs neo-button bg-white text-slate-800 font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Lihat Ringkasan AI Advisor</span>
            </Link>

            <Button
              type="button"
              onClick={handleDisposisi}
              disabled={isDisposed}
              className={cn(
                "flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md",
                isDisposed
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart Card: Academic & Attendance Health Trend */}
        <div className="lg:col-span-7 p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Tren Iklim Kehadiran &amp; Akademik Semester
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Stabil Positif
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rata-rata kumulatif mingguan vs Garis Ambang Batas KKM (75.0)
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          {/* SVG Smooth Curve Line Chart */}
          <div className="p-4 rounded-2xl neo-inset bg-[#F0F3F8] space-y-3">
            <div className="h-44 w-full relative">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#E2E8F0" strokeDasharray="4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#E2E8F0" strokeDasharray="4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#E2E8F0" strokeDasharray="4" />

                {/* KKM Threshold Line (75.0) */}
                <line x1="0" y1="75" x2="500" y2="75" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6" opacity="0.7" />
                <text x="440" y="70" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  KKM (75)
                </text>

                {/* Attendance Trend Curve (Emerald) */}
                <path
                  d="M 10 30 Q 100 20, 200 25 T 350 22 T 490 18"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Academic Score Curve (Blue) */}
                <path
                  d="M 10 90 Q 100 65, 200 60 T 350 50 T 490 42"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
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
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span className="text-slate-700 font-medium">% Kehadiran (97.4%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-slate-700 font-medium">Rata Nilai (79.2)</span>
                </div>
              </div>

              <span className="text-slate-400 font-mono text-[11px]">Pekan 1 - 4 (Ganjil)</span>
            </div>
          </div>
        </div>

        {/* Right Chart Card: Risk Distribution Semi-Donut */}
        <div className="lg:col-span-5 p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Distribusi Status EWS Sekolah
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Proporsi kesehatan iklim 1.248 siswa</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-slate-400" />
          </div>

          {/* Semi Donut Breakdown */}
          <div className="p-4 rounded-2xl neo-inset bg-[#F0F3F8] flex flex-col items-center justify-center space-y-3">
            <div className="relative w-40 h-28 flex items-center justify-center">
              {/* Decorative Arc Representation */}
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
                <span className="text-xl font-bold font-mono text-slate-900">88%</span>
                <span className="block text-[10px] font-semibold text-emerald-700 uppercase">Kondusif</span>
              </div>
            </div>

            {/* Legend Grid */}
            <div className="w-full grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-700">Normal: <strong>1.098</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-700">Berisiko: <strong>100</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-700">Waspada: <strong>38</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span className="text-slate-700 font-bold text-rose-700">Kritis: 2</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                toast({
                  title: "Laporan Sedang Diunduh",
                  description: "Format PDF Eksekutif BK-EWS sedang diexport.",
                })
              }}
              className="w-full neo-button text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Unduh Laporan Eksekutif (PDF)</span>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
