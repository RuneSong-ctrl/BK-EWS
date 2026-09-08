import * as React from "react"
import { AppLayout, type UserRole } from "@/Layouts/AppLayout"
import {
  IconUsers,
  IconBook,
  IconAlert,
  IconCalendarCheck,
  IconEye,
  IconCheckCircle,
  IconCheck,
  IconFilter,
  IconClose,
  IconAi,
  IconSpreadsheet,
  IconArrowLeft,
} from "@/components/ui/storage-icon"
import { Link } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
  metrik_24_fitur_model?: any
  faktor_pemicu: string[]
  rekomendasi_tindakan: string
  status: "pending" | "konfirmasi_tugas" | "remedial" | "selesai"
  catatan_guru_mapel: string | null
  student?: {
    id: number
    nis: string
    name: string
  }
}

interface SummaryItem {
  id: number
  siswa_id: number
  total_mapel_diambil: number
  total_mapel_berisiko: number
  total_jam_belajar: number
  total_tugas_belum_dikumpul: number
  total_tugas_terlambat: number
  inaktivitas_terlama_hari: number
  profil_karakter_belajar: string
  prioritas_konseling: "TINGGI" | "SEDANG" | "RENDAH"
  rekomendasi_tindakan: string
  rincian_per_mata_pelajaran: any[]
  status_penanganan: "open" | "in_counseling" | "resolved"
  counseling_journals?: any[]
  student?: {
    id: number
    nis: string
    name: string
  }
}

interface EwsMonitoringProps {
  courseAlerts?: AlertItem[]
  studentSummaries?: SummaryItem[]
  stats?: {
    total_alerts: number
    high_risk_alerts: number
    handled_alerts: number
    total_summaries: number
    high_priority_summaries: number
    inactive_critical: number
  }
  userRole?: UserRole
}

export default function EwsMonitoring({
  courseAlerts = [],
  studentSummaries = [],
  stats = {
    total_alerts: 0,
    high_risk_alerts: 0,
    handled_alerts: 0,
    total_summaries: 0,
    high_priority_summaries: 0,
    inactive_critical: 0,
  },
  userRole = "guru_bk",
}: EwsMonitoringProps) {
  const initialTier = userRole === "guru_kelas" ? "tier1" : "tier2"
  const [activeTier, setActiveTier] = React.useState<"tier1" | "tier2">(initialTier)
  const [selectedAlert, setSelectedAlert] = React.useState<AlertItem | null>(null)
  const [selectedSummary, setSelectedSummary] = React.useState<SummaryItem | null>(null)

  // Enforce tier per role if not kepsek
  React.useEffect(() => {
    if (userRole === "guru_kelas") {
      setActiveTier("tier1")
    } else if (userRole === "guru_bk") {
      setActiveTier("tier2")
    }
  }, [userRole])

  const backDashboardHref =
    userRole === "guru_kelas"
      ? "/guru-kelas/dashboard"
      : userRole === "guru_bk"
      ? "/guru-bk/dashboard"
      : userRole === "kepsek"
      ? "/kepsek/dashboard"
      : "/dashboard"

  return (
    <AppLayout
      currentRole={userRole}
      activeMenu="ews_monitoring"
      title="Radar EWS Moodle 2-Tier"
      subtitle="Pusat pemantauan risiko akademik dan klinis terintegrasi LMS Moodle"
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-8">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={backDashboardHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer group"
          >
            <IconArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </Link>

          <span className="text-xs text-slate-400 font-medium">
            Peran Aktif: <strong className="text-slate-700 font-bold capitalize">{userRole.replace("_", " ")}</strong>
          </span>
        </div>

        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                RADAR EWS 2-TIER
              </span>
              <span className="text-xs text-slate-500 font-bold">
                Model ML 24 Fitur LMS Moodle
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pusat Pemantauan Risiko Belajar Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {userRole === "guru_kelas"
                ? "Pemantauan Tier 1: Deteksi spesifik risiko per-mata pelajaran untuk guru pengampu berdasarkan 24 indikator aktivitas LMS Moodle."
                : userRole === "guru_bk"
                ? "Pemantauan Tier 2: Triage klinis holistik lintas mata pelajaran untuk konselor BK dalam memberikan bimbingan dan intervensi."
                : "Dua tingkatan deteksi dini otomatis: Tier 1 (evaluasi per mata pelajaran untuk guru pengampu) dan Tier 2 (rekapitulasi holistik karakter belajar untuk konselor BK)."}
            </p>
          </div>

          {/* Role-based Tier Switcher / Mode indicator */}
          {userRole === "kepsek" ? (
            <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveTier("tier2")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap",
                  activeTier === "tier2"
                    ? "neo-btn-primary shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <IconUsers className="w-3.5 h-3.5" />
                <span>Tier 2 (BK - Holistik)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTier("tier1")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap",
                  activeTier === "tier1"
                    ? "neo-btn-primary shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <IconBook className="w-3.5 h-3.5" />
                <span>Tier 1 (Mapel)</span>
              </button>
            </div>
          ) : userRole === "guru_kelas" ? (
            <div className="px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-bold flex items-center gap-2 shadow-2xs shrink-0 whitespace-nowrap">
              <IconBook className="w-4 h-4 text-indigo-600" />
              <span>Mode Guru Mapel &bull; Tier 1 (Per-Mata Pelajaran)</span>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-bold flex items-center gap-2 shadow-2xs shrink-0 whitespace-nowrap">
              <IconUsers className="w-4 h-4 text-indigo-600" />
              <span>Mode Guru BK &bull; Tier 2 (Triage Siswa Holistik)</span>
            </div>
          )}
        </div>

        {/* 4 Bento KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 10%, rgba(225, 29, 72, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Prioritas Tinggi (Tier 2)
            </span>
            <div className="text-3xl font-black text-rose-600 font-mono tracking-tight">
              {stats.high_priority_summaries} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
            </div>
            <span className="text-[11px] font-extrabold text-rose-700">
              Bermasalah di &ge; 2 mapel sekaligus
            </span>
          </div>

          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 90%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Inaktif Kritis (&gt; 14 Hari)
            </span>
            <div className="text-3xl font-black text-amber-600 font-mono tracking-tight">
              {stats.inactive_critical} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
            </div>
            <span className="text-[11px] font-bold text-amber-700">
              Absen total dari aktivitas LMS Moodle
            </span>
          </div>

          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 90%, rgba(99, 102, 241, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alert Mapel (Tier 1)
            </span>
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {stats.total_alerts} <span className="text-xs font-semibold text-slate-500 font-sans">Alert</span>
            </div>
            <span className="text-[11px] font-bold text-indigo-700">
              {stats.high_risk_alerts} berstatus risiko tinggi
            </span>
          </div>

          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Respon Tindak Lanjut
            </span>
            <div className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
              {stats.handled_alerts} <span className="text-xs font-semibold text-slate-500 font-sans">Ditangani</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700">
              Telah direspons oleh Guru Mapel / BK
            </span>
          </div>
        </div>

        {/* View Tier 2: Guru BK Holistik */}
        {activeTier === "tier2" && (
          <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 overflow-hidden shadow-xs">
            <div className="p-6 sm:p-7 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Tier 2: Rekapitulasi Karakter Belajar Siswa (Lintas Mapel)</span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {studentSummaries.length} Siswa
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Agregasi komparatif multi-kursus untuk menentukan fokus bimbingan konseling Guru BK.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/60 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Siswa</th>
                    <th className="py-4 px-6 text-center">Prioritas BK</th>
                    <th className="py-4 px-4 text-center">Mapel Berisiko</th>
                    <th className="py-4 px-4 text-center">Inaktif Terlama</th>
                    <th className="py-4 px-6">Profil Karakter Belajar</th>
                    <th className="py-4 px-6">Status Konseling</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-slate-700">
                  {studentSummaries.map((s) => (
                    <tr key={s.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {s.student?.name || `Siswa ${s.siswa_id}`}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          NIS: {s.student?.nis || s.siswa_id}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold border shadow-2xs",
                            s.prioritas_konseling === "TINGGI"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : s.prioritas_konseling === "SEDANG"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {s.prioritas_konseling}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-bold text-slate-900">
                          {s.total_mapel_berisiko} / {s.total_mapel_diambil}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">Mapel</span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono">
                        <span
                          className={cn(
                            "font-extrabold",
                            s.inaktivitas_terlama_hari > 14 ? "text-rose-600" : "text-slate-800"
                          )}
                        >
                          {s.inaktivitas_terlama_hari} hari
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800 text-xs">
                          {s.profil_karakter_belajar}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={s.rekomendasi_tindakan}>
                          {s.rekomendasi_tindakan}
                        </p>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {s.status_penanganan === "in_counseling" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
                            <IconCalendarCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Dalam Konseling</span>
                          </span>
                        )}
                        {s.status_penanganan === "open" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs whitespace-nowrap">
                            Belum Ditangani
                          </span>
                        )}
                        {s.status_penanganan === "resolved" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Selesai</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSummary(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <IconSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                          <span>Matriks Mapel</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {studentSummaries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        Tidak ada rekapitulasi siswa yang tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Tier 1: Guru Mapel */}
        {activeTier === "tier1" && (
          <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 overflow-hidden shadow-xs">
            <div className="p-6 sm:p-7 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Tier 1: Alert Kursus Spesifik Moodle</span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {courseAlerts.length} Alert
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Seluruh sinyal peringatan dini per mata pelajaran untuk evaluasi guru kelas dan remedial.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/60 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Siswa &amp; Mapel</th>
                    <th className="py-4 px-6 text-center">Tingkat Risiko</th>
                    <th className="py-4 px-4 text-center">Durasi Belajar</th>
                    <th className="py-4 px-4 text-center">Tugas Bolong</th>
                    <th className="py-4 px-6">Status Tindakan</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-slate-700">
                  {courseAlerts.map((a) => (
                    <tr key={a.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {a.student?.name || `Siswa ${a.siswa_id}`}
                        </div>
                        <span className="text-xs text-indigo-600 font-mono font-bold">
                          {a.kode_modul} &bull; {a.nama_mapel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold border shadow-2xs",
                            a.tingkat_risiko === "TINGGI"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : a.tingkat_risiko === "SEDANG"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {a.tingkat_risiko} ({Math.round(a.probabilitas_risiko * 100)}%)
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-800">
                        {a.durasi_belajar_jam} jam
                      </td>
                      <td className="py-4 px-4 text-center">
                        {a.tugas_belum_dikumpul > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            {a.tugas_belum_dikumpul} tugas
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                            <IconCheck className="w-3.5 h-3.5" /> Lengkap
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs capitalize whitespace-nowrap">
                          {a.status.replace("_", " ")}
                        </span>
                        {a.catatan_guru_mapel && (
                          <p className="text-[11px] text-slate-500 italic mt-1 truncate max-w-xs" title={a.catatan_guru_mapel}>
                            &ldquo;{a.catatan_guru_mapel}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(a)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <IconEye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {courseAlerts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        Tidak ada alert spesifik yang terdeteksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* SHADCN DIALOG: Detail Matriks Siswa (Tier 2) */}
      <Dialog open={!!selectedSummary} onOpenChange={(open) => !open && setSelectedSummary(null)}>
        <DialogContent className="max-w-2xl bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          {selectedSummary && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-3.5">
                <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
                  MATRIKS LINTAS MAPEL TIER 2
                </span>
                <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {selectedSummary.student?.name || `Siswa ${selectedSummary.siswa_id}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {selectedSummary.profil_karakter_belajar} &bull; Prioritas:{" "}
                  <strong className="text-rose-600">{selectedSummary.prioritas_konseling}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Mata Pelajaran</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Tugas Bolong</th>
                      <th className="py-3 px-3 text-center">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {(Array.isArray(selectedSummary.rincian_per_mata_pelajaran)
                      ? selectedSummary.rincian_per_mata_pelajaran
                      : []
                    ).map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{m.nama_mapel}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{m.kode_modul}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              m.status_risiko === "MERAH"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {m.status_risiko}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {m.tugas_belum_dikumpul}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {m.durasi_belajar_jam}j
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <DialogFooter className="pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSelectedSummary(null)}
                  className="px-5 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
                >
                  Tutup
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SHADCN DIALOG: Detail Alert Spesifik (Tier 1) */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-lg bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          {selectedAlert && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-3.5">
                <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
                  RINCIAN ALERT TIER 1
                </span>
                <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Alert: {selectedAlert.student?.name || `Siswa ${selectedAlert.siswa_id}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {selectedAlert.nama_mapel} ({selectedAlert.kode_modul})
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-2xl neo-card bg-white border border-slate-200/80 space-y-1.5 text-xs">
                <span className="font-bold text-slate-500 uppercase block text-[11px]">Rekomendasi AI:</span>
                <p className="text-slate-800 font-semibold leading-relaxed">{selectedAlert.rekomendasi_tindakan}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[11px] uppercase">Durasi Belajar:</span>
                  <span className="text-base font-black text-slate-900 font-mono">{selectedAlert.durasi_belajar_jam} jam</span>
                </div>
                <div className="p-3 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[11px] uppercase">Tugas Belum Dikumpul:</span>
                  <span className="text-base font-black text-rose-600 font-mono">{selectedAlert.tugas_belum_dikumpul} tugas</span>
                </div>
                <div className="p-3 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[11px] uppercase">Lesson Attempts:</span>
                  <span className="text-base font-black text-slate-900 font-mono">{selectedAlert.lesson_attempts} kali</span>
                </div>
                <div className="p-3 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[11px] uppercase">Nilai Lesson:</span>
                  <span className="text-base font-black text-slate-900 font-mono">{selectedAlert.nilai_rata_rata_lesson}</span>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-5 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
                >
                  Tutup
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </AppLayout>
  )
}
