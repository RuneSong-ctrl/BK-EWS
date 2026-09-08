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
  IconChevronDown,
  IconChevronUp,
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
    needs_action?: number
    in_counseling: number
    resolved?: number
    high_priority?: number
    medium_priority?: number
    low_priority?: number
    inactive_critical?: number
  }
  recentJournals?: CounselingJournal[]
  counselorName?: string
}

export default function GuruBkDashboard({
  studentSummaries = [],
  stats = {
    total: 0,
    needs_action: 0,
    in_counseling: 0,
    resolved: 0,
  },
  recentJournals = [],
  counselorName,
}: GuruBkProps) {
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "OPEN" | "IN_COUNSELING" | "RESOLVED">("ALL")
  const [selectedStudentSummary, setSelectedStudentSummary] = React.useState<StudentSummaryItem | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  // State Modal Form Jurnal Konseling
  const [journalModalSummary, setJournalModalSummary] = React.useState<StudentSummaryItem | null>(null)
  const [showPriorHistory, setShowPriorHistory] = React.useState(false)
  const [journalForm, setJournalForm] = React.useState({
    jenis_layanan: "konseling_individu",
    catatan_konseling: "",
    rencana_tindak_lanjut: "",
    evaluasi_perilaku: "membaik",
    status_penanganan: "in_counseling",
    tanggal_monitoring_berikutnya: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })
  const [isSubmittingJournal, setIsSubmittingJournal] = React.useState(false)

  // Hitung jumlah praktis
  const countNeedsAction = stats.needs_action ?? studentSummaries.filter((s) => s.status_penanganan === "open").length
  const countInCounseling = stats.in_counseling ?? studentSummaries.filter((s) => s.status_penanganan === "in_counseling").length
  const countResolved = stats.resolved ?? studentSummaries.filter((s) => s.status_penanganan === "resolved").length

  // Filter siswa sesuai status penanganan & pencarian nama/NIS
  const filteredSummaries = React.useMemo(() => {
    return (Array.isArray(studentSummaries) ? studentSummaries : []).filter((s) => {
      if (statusFilter === "OPEN" && s.status_penanganan !== "open") return false
      if (statusFilter === "IN_COUNSELING" && s.status_penanganan !== "in_counseling") return false
      if (statusFilter === "RESOLVED" && s.status_penanganan !== "resolved") return false

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        const nameMatch = (s.student?.name || "").toLowerCase().includes(q)
        const nisMatch = (s.student?.nis || "").toLowerCase().includes(q)
        if (!nameMatch && !nisMatch) return false
      }
      return true
    })
  }, [studentSummaries, statusFilter, searchQuery])

  const openJournalModal = (summary: StudentSummaryItem) => {
    setJournalModalSummary(summary)
    setShowPriorHistory(false)
    setJournalForm({
      jenis_layanan: "konseling_individu",
      catatan_konseling: "",
      rencana_tindak_lanjut: "",
      evaluasi_perilaku: "membaik",
      status_penanganan: summary.status_penanganan === "resolved" ? "resolved" : "in_counseling",
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
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-14 space-y-5">
        
        {/* Header Ringkas & Padat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                GURU BK &bull; TIER 2 TERPADU
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Konselor: <strong className="text-slate-800">{counselorName || "Guru BK"}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Bimbingan Konseling &amp; Penanganan Siswa
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs self-start sm:self-auto">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <IconHandshake className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Total Binaan</span>
              <span className="font-black text-slate-900 font-mono text-sm">{stats.total} Siswa</span>
            </div>
          </div>
        </div>

        {/* 3 Bento KPI Cards — Ringkas & Ergonomis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Perlu Bimbingan Segera */}
          <div
            onClick={() => setStatusFilter("OPEN")}
            className={cn(
              "p-4 sm:p-5 rounded-2xl neo-card relative overflow-hidden border border-white/90 flex items-center justify-between cursor-pointer transition-all hover:shadow-md",
              statusFilter === "OPEN" ? "ring-2 ring-rose-500/50 bg-rose-50/20" : "bg-[#EEF2F7]"
            )}
            style={{
              background:
                "radial-gradient(circle at 90% 10%, rgba(225, 29, 72, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Perlu Bimbingan
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight">
                {countNeedsAction} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <div className="text-[11px] font-semibold text-rose-700">
                Prioritas pemanggilan segera
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-2xs shrink-0">
              <IconAlert className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Sedang Dalam Proses Konseling */}
          <div
            onClick={() => setStatusFilter("IN_COUNSELING")}
            className={cn(
              "p-4 sm:p-5 rounded-2xl neo-card relative overflow-hidden border border-white/90 flex items-center justify-between cursor-pointer transition-all hover:shadow-md",
              statusFilter === "IN_COUNSELING" ? "ring-2 ring-indigo-500/50 bg-indigo-50/20" : "bg-[#EEF2F7]"
            )}
            style={{
              background:
                "radial-gradient(circle at 10% 90%, rgba(99, 102, 241, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Dalam Konseling
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono tracking-tight">
                {countInCounseling} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <div className="text-[11px] font-semibold text-indigo-700">
                Jadwal sesi tindak lanjut aktif
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
              <IconCalendarCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Konseling Selesai / Membaik */}
          <div
            onClick={() => setStatusFilter("RESOLVED")}
            className={cn(
              "p-4 sm:p-5 rounded-2xl neo-card relative overflow-hidden border border-white/90 flex items-center justify-between cursor-pointer transition-all hover:shadow-md",
              statusFilter === "RESOLVED" ? "ring-2 ring-emerald-500/50 bg-emerald-50/20" : "bg-[#EEF2F7]"
            )}
            style={{
              background:
                "radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.08) 0%, rgba(238, 242, 247, 0) 48%), #EEF2F7",
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Selesai / Membaik
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
                {countResolved} <span className="text-xs font-semibold text-slate-500 font-sans">Siswa</span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-700">
                Kasus tuntas &amp; evaluasi positif
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
              <IconCheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter Bar Sederhana & Kotak Pencarian Siswa */}
        <div className="p-4 sm:p-5 rounded-2xl neo-card bg-[#EEF2F7] border border-white/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <IconFilter className="w-3.5 h-3.5 text-slate-500" />
              <span>Status:</span>
            </span>

            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              {(
                [
                  { key: "ALL", label: `Semua (${stats.total})` },
                  { key: "OPEN", label: `Perlu Bimbingan (${countNeedsAction})` },
                  { key: "IN_COUNSELING", label: `Sedang Konseling (${countInCounseling})` },
                  { key: "RESOLVED", label: `Selesai (${countResolved})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    statusFilter === tab.key
                      ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari nama siswa atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-3.5 text-xs rounded-xl neo-inset bg-white border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Tabel Siswa Fokus Bimbingan Konseling */}
        <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 overflow-hidden shadow-xs">
          <div className="p-6 sm:p-7 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Daftar Siswa Binaan &amp; Kasus Bimbingan</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {filteredSummaries.length} Siswa
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pilih siswa untuk segera melakukan sesi bimbingan atau mencatat perkembangan pada Jurnal BK.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/60 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">NIS</th>
                  <th className="py-4 px-6">Nama Siswa</th>
                  <th className="py-4 px-5">Kelas</th>
                  <th className="py-4 px-4 text-center">Prioritas</th>
                  <th className="py-4 px-6">Indikasi Masalah Belajar</th>
                  <th className="py-4 px-5 text-center">Status Bimbingan</th>
                  <th className="py-4 px-6 text-right">Tindakan BK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-slate-700">
                {filteredSummaries.map((summary) => {
                  const studentName = summary.student?.name || `Siswa #${summary.siswa_id}`
                  const studentNis = summary.student?.nis || String(summary.siswa_id)
                  const className = summary.student?.classes?.[0]?.name || "X-RPL-1"

                  // Buat ringkasan ramah manusia
                  const redSubjects = (summary.rincian_per_mata_pelajaran || [])
                    .filter((m) => m.status_risiko === "MERAH")
                    .map((m) => m.nama_mapel)

                  const referrals = (summary.rincian_per_mata_pelajaran || []).filter(
                    (m: any) => m.status_rujukan === "dirujuk_ke_bk"
                  )

                  const latestJournal = summary.counseling_journals?.[0]

                  return (
                    <tr key={summary.id} className="hover:bg-white/50 transition-colors">
                      {/* Kolom 1: NIS */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                          {studentNis}
                        </span>
                      </td>

                      {/* Kolom 2: Nama Siswa */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentSummary(summary)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm flex items-center gap-1.5">
                            <span>{studentName}</span>
                            <IconEye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                          </div>
                          {summary.total_mapel_berisiko > 0 && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {summary.total_mapel_berisiko} dari {summary.total_mapel_diambil} mapel berisiko
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Kolom 3: Kelas */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs">
                          {className}
                        </span>
                      </td>

                      {/* Kolom 4: Prioritas */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold border shadow-2xs",
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

                      {/* Kolom 5: Indikasi Masalah Belajar */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 text-xs">
                          {summary.profil_karakter_belajar}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1.5 items-center">
                          {redSubjects.length > 0 ? (
                            <span className="text-rose-600 font-medium">
                              Mapel kendala: <strong>{redSubjects.join(", ")}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              {summary.total_tugas_belum_dikumpul > 0
                                ? `${summary.total_tugas_belum_dikumpul} tugas belum dikumpulkan`
                                : "Aktivitas belajar terpantau optimal"}
                            </span>
                          )}
                          {summary.inaktivitas_terlama_hari > 7 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold font-mono">
                              Inaktif {summary.inaktivitas_terlama_hari} hari
                            </span>
                          )}
                        </div>

                        {/* Banner jika ada rujukan langsung dari Guru Mapel */}
                        {referrals.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {referrals.map((ref: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-2 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-800 text-[11px] leading-snug shadow-2xs"
                              >
                                <div className="font-extrabold flex items-center gap-1 text-rose-700">
                                  <IconAlert className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Rujukan Guru: {ref.guru_perujuk || "Guru Mapel"} ({ref.nama_mapel})</span>
                                </div>
                                <p className="mt-0.5 text-rose-900 italic font-medium">
                                  &ldquo;{ref.catatan_rujukan}&rdquo;
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Kolom 6: Status Bimbingan */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        {summary.status_penanganan === "in_counseling" && (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                              <IconCalendarCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Dalam Konseling</span>
                            </span>
                            {latestJournal?.tanggal_monitoring_berikutnya && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Pantau: {latestJournal.tanggal_monitoring_berikutnya}
                              </span>
                            )}
                          </div>
                        )}
                        {summary.status_penanganan === "open" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Belum Ditangani</span>
                          </span>
                        )}
                        {summary.status_penanganan === "resolved" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Selesai / Membaik</span>
                          </span>
                        )}
                      </td>

                      {/* Kolom 7: Aksi Utama */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openJournalModal(summary)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                          >
                            <IconHandshake className="w-3.5 h-3.5" />
                            <span>Catat Jurnal BK</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentSummary(summary)}
                            className="px-3 py-2 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                            title="Lihat Rincian Mapel"
                          >
                            <IconSpreadsheet className="w-3.5 h-3.5 text-slate-500 inline mr-1" />
                            <span>Mapel</span>
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
                        <span className="font-bold text-sm text-slate-600">Tidak ada siswa dalam filter ini</span>
                        <span className="text-xs text-slate-400">Semua siswa pada kategori ini telah selesai ditangani atau tidak ditemukan.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histori Catatan Jurnal Konseling Terkini */}
        {recentJournals.length > 0 && (
          <div className="rounded-3xl neo-card bg-[#EEF2F7] border border-white/80 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3.5">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <IconHandshake className="w-4 h-4 text-indigo-600" />
                  <span>Histori Jurnal Konseling Terkini</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan intervensi dan tindak lanjut yang telah dilakukan Guru BK.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {recentJournals.length} Catatan Tersimpan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentJournals.map((j) => (
                <div key={j.id} className="p-5 rounded-2xl neo-card bg-white border border-slate-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        {j.summary_id ? `Siswa Kasus #${j.summary_id}` : "Siswa Binaan"}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Konselor: {j.counselor?.name || "Guru BK"} &bull; {new Date(j.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {j.jenis_layanan.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-[#EEF2F7] p-3.5 rounded-xl border border-slate-200/60 font-medium">
                    &ldquo;{j.catatan_konseling}&rdquo;
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2 pt-1">
                    <span className="text-slate-500">
                      Rencana: <strong className="text-slate-800">{j.rencana_tindak_lanjut}</strong>
                    </span>
                    {j.evaluasi_perilaku && (
                      <span className="font-bold text-indigo-600 capitalize shrink-0">
                        Evaluasi: {j.evaluasi_perilaku}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* SHADCN DIALOG 1: Detail Ringkas Mata Pelajaran Siswa */}
      <Dialog open={!!selectedStudentSummary} onOpenChange={(open) => !open && setSelectedStudentSummary(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          {selectedStudentSummary && (
            <>
              <DialogHeader className="border-b border-slate-200/60 pb-3.5">
                <span className="text-[11px] font-extrabold font-mono text-indigo-600 uppercase tracking-wider">
                  RINCIAN MATA PELAJARAN SISWA
                </span>
                <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {selectedStudentSummary.student?.name || `Siswa #${selectedStudentSummary.siswa_id}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Diagnosis Karakter: <strong className="text-slate-800">{selectedStudentSummary.profil_karakter_belajar}</strong> &bull; Prioritas:{" "}
                  <span className="font-extrabold text-rose-600">{selectedStudentSummary.prioritas_konseling}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Tabel Singkat Mata Pelajaran */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white border-b border-slate-200 font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Mata Pelajaran</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Tugas Tertunggak</th>
                      <th className="py-3 px-3 text-center">Durasi Belajar</th>
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
                            {m.guru_pengampu}
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
                            {m.status_risiko === "MERAH" ? "Perlu Remedial" : "Aman"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {m.tugas_belum_dikumpul} tugas
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {m.durasi_belajar_jam} jam
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <DialogFooter className="pt-3 border-t border-slate-200/60 flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedStudentSummary
                    setSelectedStudentSummary(null)
                    openJournalModal(item)
                  }}
                  className="px-4 py-2.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <IconHandshake className="w-4 h-4" />
                  <span>Catat Jurnal Siswa Ini</span>
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
        <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-[#EEF2F7] border border-white/90 shadow-2xl rounded-3xl">
          {journalModalSummary && (
            <>
              {/* Header Tetap di Atas */}
              <div className="px-6 py-5 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                    LAYANAN BIMBINGAN KONSELING (GURU BK)
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Kasus Siswa #{journalModalSummary.siswa_id}
                  </span>
                </div>
                <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Catat Jurnal Bimbingan &amp; Konseling Siswa
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Dokumentasikan observasi kendala belajar siswa, tentukan jenis layanan, dan susun rencana tindak lanjut terukur.
                </DialogDescription>
              </div>

              {/* Konten Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 1. Mini Card Identitas Siswa & Status EWS */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-sm shrink-0 shadow-2xs font-mono">
                      {(journalModalSummary.student?.name || "S")
                        .split(" ")
                        .map((w) => w[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                          {journalModalSummary.student?.name || `Siswa #${journalModalSummary.siswa_id}`}
                        </h4>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border",
                            journalModalSummary.prioritas_konseling === "TINGGI"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : journalModalSummary.prioritas_konseling === "SEDANG"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          Prioritas {journalModalSummary.prioritas_konseling}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>NIS: <strong className="font-mono text-slate-800">{journalModalSummary.student?.nis || "-"}</strong></span>
                        <span className="text-slate-300">&bull;</span>
                        <span>Kelas: <strong className="text-slate-800">{journalModalSummary.student?.classes?.[0]?.name || "Kelas -"}</strong></span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-slate-600 font-medium">
                          {journalModalSummary.profil_karakter_belajar}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Mapel Risiko</div>
                      <div className="text-xs font-black text-rose-600 font-mono">
                        {journalModalSummary.total_mapel_berisiko} Mapel
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tugas Pending</div>
                      <div className="text-xs font-black text-amber-600 font-mono">
                        {journalModalSummary.total_tugas_belum_dikumpul} Tugas
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Banner Rujukan dari Guru Mapel jika ada */}
                {(() => {
                  const modalReferrals = (journalModalSummary.rincian_per_mata_pelajaran || []).filter(
                    (m: any) => m.status_rujukan === "dirujuk_ke_bk"
                  )
                  return modalReferrals.length > 0 ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50/60 border border-rose-200 text-xs space-y-2 text-rose-950 shadow-2xs">
                      <div className="font-extrabold text-rose-700 flex items-center justify-between text-[11px] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <IconAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Pesan Rujukan Guru Mata Pelajaran (Tier 1 &rarr; Tier 2)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono text-[10px] font-bold">
                          {modalReferrals.length} Rujukan
                        </span>
                      </div>
                      {modalReferrals.map((ref: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/95 border border-rose-200/80 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-slate-900">
                              {ref.guru_perujuk || "Guru Pengampu"} &bull;{" "}
                              <span className="text-indigo-600">{ref.nama_mapel}</span>
                            </span>
                            {ref.tanggal_rujukan && (
                              <span className="text-slate-400 font-mono text-[10px]">
                                {ref.tanggal_rujukan}
                              </span>
                            )}
                          </div>
                          <p className="italic text-slate-700 text-xs leading-relaxed font-medium">
                            &ldquo;{ref.catatan_rujukan}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* 3. Riwayat Sesi Bimbingan Sebelumnya (Expandable / Preview) */}
                {(() => {
                  const priorJournals = journalModalSummary.counseling_journals || []
                  return priorJournals.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setShowPriorHistory(!showPriorHistory)}
                        className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <IconCalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Riwayat Bimbingan Siswa Ini ({priorJournals.length} Catatan Sebelumnya)</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
                          <span>{showPriorHistory ? "Sembunyikan Riwayat" : "Buka Riwayat Sesi"}</span>
                          {showPriorHistory ? (
                            <IconChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <IconChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </button>

                      {showPriorHistory && (
                        <div className="p-3.5 space-y-3 bg-white divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {priorJournals.map((j: any) => (
                            <div key={j.id} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-extrabold text-slate-900">
                                  {j.counselor?.name || "Guru BK"} &bull;{" "}
                                  <span className="capitalize text-indigo-700">
                                    {(j.jenis_layanan || "").replace(/_/g, " ")}
                                  </span>
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {new Date(j.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-700 text-xs italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                                &ldquo;{j.catatan_konseling}&rdquo;
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                <span>
                                  Tindak Lanjut: <strong className="text-slate-700">{j.rencana_tindak_lanjut}</strong>
                                </span>
                                {j.evaluasi_perilaku && (
                                  <span className="font-bold text-indigo-600 capitalize shrink-0">
                                    Evaluasi: {j.evaluasi_perilaku}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between text-xs text-slate-500 shadow-2xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <IconUserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sesi bimbingan perdana untuk siswa ini (belum ada catatan sebelumnya).</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Sesi Baru</span>
                    </div>
                  )
                })()}

                {/* 4. Form Input */}
                <form id="journalFormElement" onSubmit={handleSaveJournal} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Jenis Layanan Konseling <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={journalForm.jenis_layanan}
                      onChange={(e) => setJournalForm({ ...journalForm, jenis_layanan: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs font-medium"
                    >
                      <option value="konseling_individu">Konseling Individual (Tatap Muka di Ruang BK)</option>
                      <option value="pemanggilan_siswa">Pemanggilan Siswa ke Ruang BK (Observasi &amp; Klarifikasi)</option>
                      <option value="koordinasi_ortu">Koordinasi Orang Tua Siswa (Telepon / WA / Kunjungan Sekolah)</option>
                      <option value="home_visit">Kunjungan Rumah (Home Visit)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Catatan Hasil Bimbingan &amp; Temuan Masalah <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Uraikan kendala utama siswa</span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={journalForm.catatan_konseling}
                      onChange={(e) => setJournalForm({ ...journalForm, catatan_konseling: e.target.value })}
                      placeholder="Uraikan hasil wawancara / kendala siswa (misal: begadang bermain game hingga larut malam, kendala gawai rusak, masalah keluarga, atau kesulitan materi modul)..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Rencana Tindak Lanjut &amp; Komitmen Siswa <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Kesepakatan solusi terukur</span>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={journalForm.rencana_tindak_lanjut}
                      onChange={(e) => setJournalForm({ ...journalForm, rencana_tindak_lanjut: e.target.value })}
                      placeholder="Langkah nyata yang disepakati (misal: menyusun jadwal belajar mandiri 1 jam/hari, koordinasi susulan tugas dengan guru mapel, peminjaman fasilitas sekolah)..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs leading-relaxed"
                    />
                  </div>

                  {/* 3-Column Compact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Evaluasi Siswa
                      </label>
                      <select
                        value={journalForm.evaluasi_perilaku}
                        onChange={(e) => setJournalForm({ ...journalForm, evaluasi_perilaku: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs font-medium"
                      >
                        <option value="membaik">Membaik</option>
                        <option value="tetap">Tetap / Perlu Pemantauan</option>
                        <option value="memburuk">Memburuk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Status Kasus Siswa
                      </label>
                      <select
                        value={journalForm.status_penanganan}
                        onChange={(e) => setJournalForm({ ...journalForm, status_penanganan: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs font-bold"
                      >
                        <option value="in_counseling">Tetap Dalam Bimbingan</option>
                        <option value="resolved">Tandai Selesai / Membaik</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tanggal Sesi Berikutnya
                      </label>
                      <input
                        type="date"
                        value={journalForm.tanggal_monitoring_berikutnya}
                        onChange={(e) => setJournalForm({ ...journalForm, tanggal_monitoring_berikutnya: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none font-mono shadow-2xs"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer Tetap di Bawah */}
              <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-slate-400 font-medium">
                  Tersimpan otomatis atas nama <strong className="text-slate-600">{counselorName || "Guru BK"}</strong>
                </div>
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setJournalModalSummary(null)}
                    className="px-4 py-2.5 rounded-xl neo-btn bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    form="journalFormElement"
                    disabled={isSubmittingJournal}
                    className="px-5 py-2.5 rounded-xl neo-btn-primary text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <IconSave className="w-3.5 h-3.5" />
                    <span>{isSubmittingJournal ? "Menyimpan Catatan..." : "Simpan Jurnal BK"}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </AppLayout>
  )
}
