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
  IconCalendar,
  IconCalendarCheck,
  IconHandshake,
  IconUser,
  IconUserCheck,
  IconUsers,
  IconArrowRight,
  IconFilter,
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

interface SubjectDetail {
  kode_modul: string
  nama_mapel: string
  kategori: string
  guru_pengampu: string
  probabilitas: number
  status_risiko: "MERAH" | "KUNING" | "HIJAU"
  tugas_belum_dikumpul: number
  durasi_belajar_jam: number
  lesson_attempts?: number
  days_inactive?: number
  avg_score?: number
}

interface CounselingJournal {
  id: number
  summary_id: number
  guru_bk_id: number
  jenis_layanan: "konseling_individu" | "pemanggilan_siswa" | "home_visit" | "koordinasi_ortu"
  catatan_konseling: string
  rencana_tindak_lanjut: string
  evaluasi_perilaku?: "membaik" | "tetap" | "memburuk" | null
  tanggal_monitoring_berikutnya?: string | null
  created_at: string
  counselor?: {
    name: string
  }
}

interface StudentSummaryItem {
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
  rincian_per_mata_pelajaran: SubjectDetail[]
  status_penanganan: "open" | "in_counseling" | "resolved"
  counseling_journals?: CounselingJournal[]
  student?: {
    id: number
    nis: string
    nisn: string
    name: string
    classes?: Array<{ name: string }>
  }
}

interface GuruBkProps {
  studentSummaries?: StudentSummaryItem[]
  stats?: {
    total: number
    high_priority: number
    medium_priority: number
    low_priority: number
    inactive_critical: number
    in_counseling: number
  }
  recentJournals?: CounselingJournal[]
  counselorName?: string
}

export default function GuruBkDashboard({
  studentSummaries = [],
  stats = {
    total: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0,
    inactive_critical: 0,
    in_counseling: 0,
  },
  recentJournals = [],
  counselorName,
}: GuruBkProps) {
  const [triageFilter, setTriageFilter] = React.useState<"ALL" | "TINGGI" | "INAKTIF_KRITIS" | "SEDANG">("ALL")
  const [selectedStudentSummary, setSelectedStudentSummary] = React.useState<StudentSummaryItem | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  // State Modal Jurnal Konseling
  const [journalModalSummary, setJournalModalSummary] = React.useState<StudentSummaryItem | null>(null)
  const [journalForm, setJournalForm] = React.useState({
    jenis_layanan: "konseling_individu",
    catatan_konseling: "",
    rencana_tindak_lanjut: "",
    evaluasi_perilaku: "membaik",
    tanggal_monitoring_berikutnya: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })
  const [isSubmittingJournal, setIsSubmittingJournal] = React.useState(false)

  // Filter siswa sesuai triage dan pencarian
  const filteredSummaries = React.useMemo(() => {
    return (Array.isArray(studentSummaries) ? studentSummaries : []).filter((s) => {
      if (triageFilter === "TINGGI" && s.prioritas_konseling !== "TINGGI") return false
      if (triageFilter === "INAKTIF_KRITIS" && s.inaktivitas_terlama_hari <= 14) return false
      if (triageFilter === "SEDANG" && s.prioritas_konseling !== "SEDANG") return false

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        const nameMatch = (s.student?.name || "").toLowerCase().includes(q)
        const nisMatch = (s.student?.nis || "").toLowerCase().includes(q)
        if (!nameMatch && !nisMatch) return false
      }
      return true
    })
  }, [studentSummaries, triageFilter, searchQuery])

  const openJournalModal = (summary: StudentSummaryItem) => {
    setJournalModalSummary(summary)
    setJournalForm({
      jenis_layanan: "konseling_individu",
      catatan_konseling: "",
      rencana_tindak_lanjut: "",
      evaluasi_perilaku: "membaik",
      tanggal_monitoring_berikutnya: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    })
  }

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!journalModalSummary) return

    setIsSubmittingJournal(true)
    router.post(
      "/ews/interventions",
      {
        summary_id: journalModalSummary.id,
        ...journalForm,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSubmittingJournal(false)
          setJournalModalSummary(null)
        },
        onError: () => {
          setIsSubmittingJournal(false)
        },
        onFinish: () => {
          setIsSubmittingJournal(false)
        },
      }
    )
  }

  return (
    <AppLayout
      currentRole="guru_bk"
      activeMenu="dashboard"
      title="Guru BK — Tier 2 Clinical Triage & Konseling"
      subtitle="Rekapitulasi holistik karakter belajar lintas mata pelajaran dan penanganan bimbingan siswa"
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-8">
        
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                TIER 2 &bull; GURU BIMBINGAN KONSELING
              </span>
              <span className="text-xs text-slate-500 font-bold">
                Konselor: {counselorName || "Guru BK / Konselor"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Clinical Triage &amp; Manajemen Kasus Holistik
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Analisis komparatif lintas seluruh mata pelajaran untuk mengidentifikasi akar permasalahan belajar siswa (kronis multi-mapel vs kendala spesifik mapel tertentu) guna menentukan intervensi konseling yang tepat.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 bg-white/80 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <IconHandshake className="w-5 h-5" />
            </div>
            <div className="pr-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Siswa Terpantau</div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {stats.total} <span className="text-xs font-semibold text-slate-500">Siswa</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Bento KPI Cards (Neumorphic with Varied Ambient Silhouette Glow) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* Card 1: Prioritas Tinggi */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 10%, rgba(225, 29, 72, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Prioritas Tinggi (Multi-Mapel)
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-2xs">
                <IconAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-rose-600 font-mono tracking-tight">
                {stats.high_priority} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Bermasalah pada &ge; 2 mata pelajaran sekaligus
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Jadwalkan konseling &amp; hubungi ortu</span>
            </div>
          </div>

          {/* Card 2: Inaktif Kritis */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 90%, rgba(245, 158, 11, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Inaktif Kritis (&gt; 14 Hari)
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
                <IconCalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-600 font-mono tracking-tight">
                {stats.inactive_critical} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Menghilang dan tidak membuka LMS Moodle
              </p>
            </div>
            <div className="text-[11px] font-bold text-amber-700">
              Perlu konfirmasi presensi fisik / home visit
            </div>
          </div>

          {/* Card 3: Kendala Spesifik */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kendala Spesifik (1 Mapel)
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
                <IconBook className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {stats.medium_priority} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Performa aman di mata pelajaran lain
              </p>
            </div>
            <div className="text-[11px] font-bold text-blue-700">
              Koordinasi dengan Guru Mapel bersangkutan
            </div>
          </div>

          {/* Card 4: Dalam Konseling */}
          <div
            className="p-6 sm:p-7 rounded-3xl neo-card relative overflow-hidden border border-white/80 flex flex-col justify-between min-h-[155px] space-y-4"
            style={{
              background:
                "radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sedang Dalam Konseling
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
                <IconCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
                {stats.in_counseling} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Memiliki sesi konseling aktif / terjadwal
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-700">
              {stats.total > 0
                ? `${Math.round((stats.in_counseling / stats.total) * 100)}% siswa tertangani`
                : "Semua sesi terekam"}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 rounded-2xl neo-card bg-[#EEF2F7] border border-white/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <IconFilter className="w-3.5 h-3.5 text-slate-500" />
              <span>Triage:</span>
            </span>

            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              {(
                [
                  { key: "ALL", label: `Semua (${stats.total})` },
                  { key: "TINGGI", label: `Prioritas Tinggi (${stats.high_priority})` },
                  { key: "INAKTIF_KRITIS", label: `Inaktif >14 Hari (${stats.inactive_critical})` },
                  { key: "SEDANG", label: `Kendala Spesifik (${stats.medium_priority})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTriageFilter(tab.key)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    triageFilter === tab.key
                      ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

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

        {/* Main Table: Clinical Triage Siswa Holistik */}
        <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 overflow-hidden shadow-xs">
          <div className="p-6 sm:p-7 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Tabel Triage Klinis Siswa Terindikasi</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {filteredSummaries.length} Siswa
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Daftar rekapitulasi siswa semester aktif. Klik baris atau tombol Matriks untuk melihat komparasi seluruh mata pelajaran yang diambil.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/60 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Siswa</th>
                  <th className="py-4 px-6 text-center">Prioritas</th>
                  <th className="py-4 px-4 text-center">Mapel Bermasalah</th>
                  <th className="py-4 px-4 text-center">Inaktif Terlama</th>
                  <th className="py-4 px-6">Diagnosis Karakter Belajar</th>
                  <th className="py-4 px-6">Status Konseling</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-slate-700">
                {filteredSummaries.map((summary) => {
                  const studentName = summary.student?.name || `Siswa ${summary.siswa_id}`

                  return (
                    <tr key={summary.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentSummary(summary)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            <span>{studentName}</span>
                            <IconEye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            NIS: {summary.student?.nis || summary.siswa_id}
                          </span>
                        </button>
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold border shadow-2xs whitespace-nowrap",
                            summary.prioritas_konseling === "TINGGI"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : summary.prioritas_konseling === "SEDANG"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {summary.prioritas_konseling}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {summary.total_mapel_berisiko} / {summary.total_mapel_diambil}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">Mapel</span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                        <span
                          className={cn(
                            "font-extrabold whitespace-nowrap",
                            summary.inaktivitas_terlama_hari > 14
                              ? "text-rose-600"
                              : "text-slate-800"
                          )}
                        >
                          {summary.inaktivitas_terlama_hari} hari
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800 text-xs">
                          {summary.profil_karakter_belajar}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={summary.rekomendasi_tindakan}>
                          {summary.rekomendasi_tindakan}
                        </p>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {summary.status_penanganan === "in_counseling" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs whitespace-nowrap">
                            <IconCalendarCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Dalam Konseling</span>
                          </span>
                        )}
                        {summary.status_penanganan === "open" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs whitespace-nowrap">
                            Belum Ditangani
                          </span>
                        )}
                        {summary.status_penanganan === "resolved" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Selesai Ditangani</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openJournalModal(summary)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                          >
                            <IconHandshake className="w-3.5 h-3.5" />
                            <span>Jurnal BK</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentSummary(summary)}
                            className="p-2 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs shadow-2xs active:scale-95 cursor-pointer"
                            title="Buka Matriks Lintas Mapel"
                          >
                            <IconSpreadsheet className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredSummaries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <IconCheckCircle className="w-8 h-8 text-emerald-500/70" />
                        <span className="font-bold text-sm text-slate-600">Tidak ada siswa dalam kategori triage ini</span>
                        <span className="text-xs text-slate-400">Seluruh siswa aktif berada di luar parameter risiko yang dipilih.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Jurnal Konseling Terkini Feed */}
        {recentJournals.length > 0 && (
          <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3.5">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <IconHandshake className="w-4 h-4 text-indigo-600" />
                  <span>Histori Sesi Konseling Terkini</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan intervensi konseling yang telah dilakukan oleh Guru BK terhadap siswa terindikasi.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {recentJournals.length} Sesi Tercatat
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentJournals.map((j) => (
                <div key={j.id} className="p-4 rounded-2xl neo-card bg-white border border-slate-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        {j.summary_id ? `Siswa ID #${j.summary_id}` : "Siswa Binaan"}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Konselor: {j.counselor?.name || "Guru BK"} &bull; {new Date(j.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {j.jenis_layanan.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-[#EEF2F7] p-3 rounded-xl border border-slate-200/60">
                    &ldquo;{j.catatan_konseling}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 font-medium">
                      Rencana: <strong className="text-slate-800">{j.rencana_tindak_lanjut}</strong>
                    </span>
                    {j.evaluasi_perilaku && (
                      <span className="font-bold text-indigo-600 capitalize">
                        Status: {j.evaluasi_perilaku}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* SHADCN DIALOG 1: Matriks Performa Lintas Mapel Siswa */}
      <Dialog open={!!selectedStudentSummary} onOpenChange={(open) => !open && setSelectedStudentSummary(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
          {selectedStudentSummary && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-4">
                <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
                  MATRIKS KOMPARATIF LINTAS MAPEL — TIER 2
                </span>
                <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {selectedStudentSummary.student?.name || `Siswa ${selectedStudentSummary.siswa_id}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Diagnosis Karakter: <strong className="text-slate-800">{selectedStudentSummary.profil_karakter_belajar}</strong> &bull; Prioritas Konseling:{" "}
                  <span className="font-extrabold text-rose-600">{selectedStudentSummary.prioritas_konseling}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Rekap Semester Ringkas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Mapel Berisiko</span>
                  <div className="text-lg font-black text-rose-600 font-mono mt-0.5">
                    {selectedStudentSummary.total_mapel_berisiko} / {selectedStudentSummary.total_mapel_diambil}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Jam Belajar</span>
                  <div className="text-lg font-black text-indigo-600 font-mono mt-0.5">
                    {selectedStudentSummary.total_jam_belajar} jam
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Tugas Belum Dikumpul</span>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    {selectedStudentSummary.total_tugas_belum_dikumpul} tugas
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl neo-card bg-white border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Inaktif Terlama</span>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    {selectedStudentSummary.inaktivitas_terlama_hari} hari
                  </div>
                </div>
              </div>

              {/* Tabel Matriks Lintas Kursus */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Rincian Per Mata Pelajaran yang Diambil
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white border-b border-slate-200 font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Modul &amp; Mapel</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center">Tugas Bolong</th>
                        <th className="py-3 px-3 text-center">Durasi Jam</th>
                        <th className="py-3 px-3 text-center">Lesson</th>
                        <th className="py-3 px-3 text-center">Inaktif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {(Array.isArray(selectedStudentSummary.rincian_per_mata_pelajaran)
                        ? selectedStudentSummary.rincian_per_mata_pelajaran
                        : []
                      ).map((m, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{m.nama_mapel}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {m.kode_modul} &bull; {m.guru_pengampu}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap",
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
                          <td className="py-3 px-3 text-center font-mono">
                            {m.lesson_attempts ?? 0}x
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {m.days_inactive ?? 0}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-slate-200/60 flex items-center justify-between sm:justify-between w-full">
                <button
                  type="button"
                  onClick={() => openJournalModal(selectedStudentSummary)}
                  className="px-4 py-2.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <IconHandshake className="w-4 h-4" />
                  <span>Catat Jurnal Konseling Siswa Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentSummary(null)}
                  className="px-5 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
                >
                  Tutup
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SHADCN DIALOG 2: Form Catat Jurnal Konseling BK */}
      <Dialog open={!!journalModalSummary} onOpenChange={(open) => !open && setJournalModalSummary(null)}>
        <DialogContent className="max-w-lg bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          {journalModalSummary && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-3.5">
                <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
                  LAYANAN BIMBINGAN KONSELING
                </span>
                <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Pencatatan Sesi Konseling Siswa
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {journalModalSummary.student?.name || `Siswa ${journalModalSummary.siswa_id}`} &bull; {journalModalSummary.profil_karakter_belajar}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveJournal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jenis Layanan Konseling
                  </label>
                  <select
                    value={journalForm.jenis_layanan}
                    onChange={(e) => setJournalForm({ ...journalForm, jenis_layanan: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs font-medium"
                  >
                    <option value="konseling_individu">Konseling Individual</option>
                    <option value="pemanggilan_siswa">Pemanggilan Siswa ke Ruang BK</option>
                    <option value="koordinasi_ortu">Komunikasi / Koordinasi Orang Tua (WA/Tatap Muka)</option>
                    <option value="home_visit">Kunjungan Rumah (Home Visit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Catatan Temuan Sesi Konseling
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={journalForm.catatan_konseling}
                    onChange={(e) => setJournalForm({ ...journalForm, catatan_konseling: e.target.value })}
                    placeholder="Contoh: Siswa mengakui sering bergadang bermain game sehingga menunda pengerjaan tugas modul Web dan Basis Data..."
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Rencana Tindak Lanjut &amp; Solusi
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={journalForm.rencana_tindak_lanjut}
                    onChange={(e) => setJournalForm({ ...journalForm, rencana_tindak_lanjut: e.target.value })}
                    placeholder="Contoh: Penyusunan jadwal belajar mandiri, konfirmasi tugas susulan ke guru mapel..."
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Evaluasi Perilaku
                    </label>
                    <select
                      value={journalForm.evaluasi_perilaku}
                      onChange={(e) => setJournalForm({ ...journalForm, evaluasi_perilaku: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    >
                      <option value="membaik">Membaik</option>
                      <option value="tetap">Tetap / Dalam Pantauan</option>
                      <option value="memburuk">Memburuk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Jadwal Pantau Berikutnya
                    </label>
                    <input
                      type="date"
                      value={journalForm.tanggal_monitoring_berikutnya}
                      onChange={(e) => setJournalForm({ ...journalForm, tanggal_monitoring_berikutnya: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none font-mono shadow-2xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setJournalModalSummary(null)}
                    className="px-4 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingJournal}
                    className="px-5 py-2.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <IconSave className="w-3.5 h-3.5" />
                    <span>{isSubmittingJournal ? "Menyimpan..." : "Simpan Jurnal Konseling"}</span>
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
