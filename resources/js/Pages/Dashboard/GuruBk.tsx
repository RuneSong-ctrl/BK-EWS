import * as React from "react"
import {
  HeartHandshake,
  AlertOctagon,
  Clock,
  CheckCircle,
  Plus,
  Shield,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  FileText,
  UserPlus,
  ChevronRight,
  Lock,
} from "lucide-react"
import { Link } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EwsStatusBadge, type EwsStatus } from "@/components/ews/EwsStatusBadge"
import { PillarIndicators, type PillarStatuses } from "@/components/ews/PillarIndicators"
import { LinearScale } from "@/components/forms/LinearScale"
import { StudentAutocomplete, type StudentOption } from "@/components/forms/StudentAutocomplete"
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

const mockAllStudents: StudentOption[] = [
  { id: 1, name: "Ahmad Fauzi", nisn: "0089218821", class_name: "10-MIPA-1", ews_status: "WASPADA" },
  { id: 5, name: "Dimas Pratama", nisn: "0089218825", class_name: "11-IPS-2", ews_status: "KRITIS" },
  { id: 7, name: "Reza Mahendra", nisn: "0089218827", class_name: "10-MIPA-3", ews_status: "KRITIS" },
  { id: 8, name: "Siti Nurhaliza", nisn: "0089218828", class_name: "11-MIPA-2", ews_status: "WASPADA" },
  { id: 9, name: "Fajar Ramadhan", nisn: "0089218829", class_name: "12-IPS-1", ews_status: "BERISIKO" },
  { id: 10, name: "Putri Anggraini", nisn: "0089218830", class_name: "10-IPS-1", ews_status: "NORMAL" },
]

const mockWatchlist = [
  {
    id: 5,
    name: "Dimas Pratama",
    class_name: "11-IPS-2",
    trigger: "Alpa 4 Hari Beruntun + Rata Nilai 54 (Turun)",
    status: "KRITIS" as EwsStatus,
    urgency: "Mendesak (Tindak Lanjut Segera)",
  },
  {
    id: 7,
    name: "Reza Mahendra",
    class_name: "10-MIPA-3",
    trigger: "Kasus Pelanggaran Berat Terdaftar & Menolak Mediasi",
    status: "KRITIS" as EwsStatus,
    urgency: "Konferensi Kasus Bersama Kepsek",
  },
  {
    id: 1,
    name: "Ahmad Fauzi",
    class_name: "10-MIPA-1",
    trigger: "Isolasi Sosial & Nilai Matematika <45",
    status: "WASPADA" as EwsStatus,
    urgency: "Sesi Konseling Individu Tahap 2",
  },
]

const mockRecentCases: BkCaseItem[] = [
  {
    id: 101,
    title: "Mediasi Konflik Antar Siswa (Kerja Kelompok)",
    student_name: "Dimas Pratama & Tim",
    class_name: "11-IPS-2",
    severity: "SEDANG",
    status: "DALAM_PROSES",
    date: "14 Agu 2026",
    counselor: "Budi Pratama, M.Kons",
  },
  {
    id: 102,
    title: "Pelanggaran Tata Tertib & Indikasi Intimidasi",
    student_name: "Reza Mahendra",
    class_name: "10-MIPA-3",
    severity: "BERAT",
    status: "DIESKALASI_KE_KEPSEK",
    date: "13 Agu 2026",
    counselor: "Budi Pratama, M.Kons",
  },
  {
    id: 103,
    title: "Bimbingan Motivasi Belajar & Manajemen Waktu",
    student_name: "Ahmad Fauzi",
    class_name: "10-MIPA-1",
    severity: "RINGAN",
    status: "DALAM_PROSES",
    date: "12 Agu 2026",
    counselor: "Budi Pratama, M.Kons",
  },
  {
    id: 104,
    title: "Pendampingan Pasca Pemulihan Trauma Sakit Kronis",
    student_name: "Siti Nurhaliza",
    class_name: "11-MIPA-2",
    severity: "SEDANG",
    status: "SELESAI",
    date: "10 Agu 2026",
    counselor: "Budi Pratama, M.Kons",
  },
]

const mockHolisticMatrix: HolisticStudentItem[] = [
  {
    id: 5,
    name: "Dimas Pratama",
    nisn: "0089218825",
    class_name: "11-IPS-2",
    grade: "XI",
    pillars: { ak: "KRITIS", kh: "WASPADA", pr: "BERISIKO", bk: "NORMAL" },
    ews_status: "KRITIS",
    trigger_reason: "Penurunan nilai drastis & alpa beruntun",
  },
  {
    id: 7,
    name: "Reza Mahendra",
    nisn: "0089218827",
    class_name: "10-MIPA-3",
    grade: "X",
    pillars: { ak: "NORMAL", kh: "NORMAL", pr: "WASPADA", bk: "KRITIS" },
    ews_status: "KRITIS",
    trigger_reason: "Kasus pelanggaran berat terdaftar",
  },
  {
    id: 1,
    name: "Ahmad Fauzi",
    nisn: "0089218821",
    class_name: "10-MIPA-1",
    grade: "X",
    pillars: { ak: "WASPADA", kh: "WASPADA", pr: "BERISIKO", bk: "NORMAL" },
    ews_status: "WASPADA",
    trigger_reason: "Alpa 4 hari & isolasi sosial",
  },
  {
    id: 8,
    name: "Siti Nurhaliza",
    nisn: "0089218828",
    class_name: "11-MIPA-2",
    grade: "XI",
    pillars: { ak: "NORMAL", kh: "WASPADA", pr: "NORMAL", bk: "NORMAL" },
    ews_status: "WASPADA",
    trigger_reason: "Kehadiran menurun pasca pemulihan",
  },
  {
    id: 9,
    name: "Fajar Ramadhan",
    nisn: "0089218829",
    class_name: "12-IPS-1",
    grade: "XII",
    pillars: { ak: "BERISIKO", kh: "NORMAL", pr: "NORMAL", bk: "NORMAL" },
    ews_status: "BERISIKO",
    trigger_reason: "Nilai ujian tryout di bawah KKM",
  },
]

export default function GuruBk() {
  const [selectedStudent, setSelectedStudent] = React.useState<StudentOption | null>({
    id: 5,
    name: "Dimas Pratama",
    nisn: "0089218825",
    class_name: "11-IPS-2",
    ews_status: "KRITIS",
  })
  const [urgencyScore, setUrgencyScore] = React.useState(4)
  const [rapportScore, setRapportScore] = React.useState(3)
  const [resolutionProgress, setResolutionProgress] = React.useState(40)
  const [sessionType, setSessionType] = React.useState("KONSELING_INDIVIDU")
  const [confidentialNotes, setConfidentialNotes] = React.useState(
    "Siswa mengeluhkan tekanan akademik dan masalah penyesuaian sosial di kelas. Mulai terbuka setelah eksplorasi minat karir. Disepakati target kehadiran mingguan."
  )
  const [callParent, setCallParent] = React.useState(true)
  const [referPsychologist, setReferPsychologist] = React.useState(false)
  const [escalateKepsek, setEscalateKepsek] = React.useState(false)

  // Filters
  const [gradeFilter, setGradeFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  const handleSaveCounselingSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Pilih siswa melalui kolom pencarian sebelum menyimpan sesi.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Sesi Konseling Berhasil Dicatat",
      description: `Log konseling untuk ${selectedStudent.name} tersimpan aman dengan enkripsi AES-256.`,
      variant: "success",
    })
  }

  const filteredMatrix = mockHolisticMatrix.filter((item) => {
    const matchGrade = gradeFilter === "ALL" || item.grade === gradeFilter
    const matchStatus = statusFilter === "ALL" || item.ews_status === statusFilter
    return matchGrade && matchStatus
  })

  return (
    <AppLayout
      currentRole="guru_bk"
      activeMenu="kasus_bk"
      title="Dashboard Guru Bimbingan Konseling (Guru BK)"
      subtitle="Konsolidasi portofolio konseling, pemantauan siswa risiko tinggi, dan penanganan kasus lintas kelas"
    >
      {/* Top 4 Elevated Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[126px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Kasus Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">14 Kasus</div>
            <p className="text-xs text-slate-500 mt-0.5">Lintas Kelas X, XI, XII</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[126px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status Kritis (EWS)
            </span>
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-600 shadow-sm">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight text-rose-600">
              2 Siswa
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Perlu Penanganan Prioritas</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[126px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Dalam Proses Mediasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-amber-600 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">5 Kasus</div>
            <p className="text-xs text-slate-500 mt-0.5">Sesi Berjalan Pekan Ini</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl neo-card bg-[#F0F3F8] border border-white flex flex-col justify-between h-[126px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Kasus Terselesaikan
            </span>
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">28 Kasus</div>
            <p className="text-xs text-slate-500 mt-0.5">Semester Berjalan</p>
          </div>
        </div>
      </div>

      {/* Input Panel Kasus & Sesi Konseling Baru (Guru BK Scope) */}
      <section
        id="kasus"
        className="p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Input Kasus &amp; Dokumentasi Sesi Konseling Baru
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Konselor BK
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan rekam bimbingan konseling, skala urgensi, dan rencana tindak lanjut
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enkripsi Model AES-256</span>
          </div>
        </div>

        <form onSubmit={handleSaveCounselingSession} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Cross-Class Autocomplete & Scales */}
            <div className="lg:col-span-5 space-y-4">
              <StudentAutocomplete
                students={mockAllStudents}
                selectedStudent={selectedStudent}
                onSelect={setSelectedStudent}
                label="Pilih Siswa (Lintas Seluruh Kelas):"
                placeholder="Cari siswa seluruh sekolah..."
              />

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Jenis Layanan / Sesi Konseling:
                </Label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl neo-inset bg-[#F0F3F8] text-xs font-semibold text-slate-800 border-slate-200"
                >
                  <option value="KONSELING_INDIVIDU">Konseling Individu Personal</option>
                  <option value="MEDIASI_PEER">Mediasi Konflik Teman Sebaya</option>
                  <option value="BIMBINGAN_KELOMPOK">Bimbingan Kelompok Terarah</option>
                  <option value="KONFERENSI_ORTU">Konferensi Kasus Bersama Wali Murid</option>
                </select>
              </div>

              {/* Linear Scales in Guru BK Scope */}
              <div className="p-4 rounded-2xl neo-card-subtle bg-slate-50/70 border border-slate-200/80 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Skala Evaluasi Konseling BK
                </span>

                {/* 1. Urgensi Kasus Scale */}
                <LinearScale
                  label="Tingkat Urgensi / Keparahan Kasus"
                  description="Penilaian ancaman terhadap iklim belajar dan psikososial"
                  min={1}
                  max={5}
                  value={urgencyScore}
                  onChange={setUrgencyScore}
                  minLabel="1 (Rutin)"
                  midLabel="3 (Perhatian)"
                  maxLabel="5 (Kritis)"
                />

                {/* 2. Indeks Keterbukaan Siswa */}
                <LinearScale
                  label="Indeks Keterbukaan &amp; Rapport Siswa"
                  description="Tingkat kooperatif dan refleksi diri saat sesi berlangsung"
                  min={1}
                  max={5}
                  value={rapportScore}
                  onChange={setRapportScore}
                  minLabel="Resisten"
                  midLabel="Kooperatif"
                  maxLabel="Sangat Terbuka"
                />

                {/* 3. Progres Resolusi Kasus */}
                <LinearScale
                  label="Progres Resolusi Kasus"
                  description="Persentase pemulihan dan pencapaian target komitmen"
                  min={0}
                  max={100}
                  step={10}
                  mode="continuous"
                  value={resolutionProgress}
                  onChange={setResolutionProgress}
                  minLabel="0% (Baru)"
                  maxLabel="100% (Tuntas)"
                />
              </div>
            </div>

            {/* Right Column: Confidential Notes & Follow-up actions */}
            <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidentialNotes" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Catatan Sesi Konseling Rahasia (Encrypted Inset Box)</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Akses dibatasi sesuai UU PDP
                  </span>
                </div>

                <Textarea
                  id="confidentialNotes"
                  rows={6}
                  value={confidentialNotes}
                  onChange={(e) => setConfidentialNotes(e.target.value)}
                  placeholder="Catatan verbatim konseling, dinamika psikososial, dan observasi afektif siswa..."
                  className="w-full p-4 rounded-2xl neo-inset bg-[#F0F3F8] text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed border-slate-200 min-h-[160px] focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Tindak Lanjut Checkboxes */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Rencana Tindak Lanjut &amp; Eskalasi:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={callParent}
                      onChange={(e) => setCallParent(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Panggil Orang Tua</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={referPsychologist}
                      onChange={(e) => setReferPsychologist(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Rujuk ke Psikolog/PPA</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={escalateKepsek}
                      onChange={(e) => setEscalateKepsek(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="font-semibold text-rose-700">Eskalasi ke Kepsek</span>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  className="neo-button bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Simpan Sesi Konseling BK</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Split Section: Watchlist & Recent Cases Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Priority EWS Watchlist */}
        <div className="lg:col-span-6 p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Siswa Prioritas EWS (Watchlist Sekolah)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  {mockWatchlist.length} Siswa
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Siswa dengan status Kritis / Waspada yang memicu alarm EWS
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {mockWatchlist.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl neo-card-subtle bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between gap-3 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                        {item.class_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Trigger: <span className="text-slate-800">{item.trigger}</span>
                    </p>
                  </div>

                  <EwsStatusBadge status={item.status} size="sm" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-[11px] text-amber-700 font-semibold">
                    {item.urgency}
                  </span>
                  <Link
                    href={`/students/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Buka Lembar BK</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Counseling Case Feed */}
        <div className="lg:col-span-6 p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Feed Kasus BK &amp; Tindak Lanjut Aktif
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aktivitas penanganan dan status eskalasi kasus terkini
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {mockRecentCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="p-3.5 rounded-2xl neo-card-subtle bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-white transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{caseItem.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {caseItem.student_name} ({caseItem.class_name}) &bull; {caseItem.date}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                      caseItem.status === "DIESKALASI_KE_KEPSEK"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : caseItem.status === "DALAM_PROSES"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    )}
                  >
                    {caseItem.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                  <span>Konselor: {caseItem.counselor}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      caseItem.severity === "BERAT" ? "text-rose-600" : "text-slate-600"
                    )}
                  >
                    Severity: {caseItem.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Holistic Student Matrix Across School */}
      <section className="p-6 rounded-3xl neo-card bg-white border border-white/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Matriks Holistik Siswa Seluruh Sekolah (Cross-Class EWS)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Konsolidasi 4 pilar EWS di seluruh jenjang kelas (X, XI, XII)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl neo-inset bg-[#F0F3F8] text-xs font-semibold text-slate-700 border-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl neo-inset bg-[#F0F3F8] text-xs font-semibold text-slate-700 border-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Status EWS</option>
              <option value="NORMAL">Normal</option>
              <option value="BERISIKO">Berisiko</option>
              <option value="WASPADA">Waspada</option>
              <option value="KRITIS">Kritis</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 neo-card-subtle bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F0F3F8] text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-3">Kelas / Jenjang</th>
                <th className="py-3 px-3">Pilar AK</th>
                <th className="py-3 px-3">Pilar KH</th>
                <th className="py-3 px-3">Pilar PR</th>
                <th className="py-3 px-3">Pilar BK</th>
                <th className="py-3 px-3">Status EWS</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatrix.map((student) => (
                <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {student.name}
                    <span className="block text-[11px] text-slate-400 font-normal font-mono">
                      NISN: {student.nisn}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {student.class_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <EwsStatusBadge status={student.pillars.ak} size="sm" showDot={false} />
                  </td>
                  <td className="py-3.5 px-3">
                    <EwsStatusBadge status={student.pillars.kh} size="sm" showDot={false} />
                  </td>
                  <td className="py-3.5 px-3">
                    <EwsStatusBadge status={student.pillars.pr} size="sm" showDot={false} />
                  </td>
                  <td className="py-3.5 px-3">
                    <EwsStatusBadge status={student.pillars.bk} size="sm" showDot={false} />
                  </td>
                  <td className="py-3.5 px-3">
                    <EwsStatusBadge status={student.ews_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/students/${student.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50"
                    >
                      <span>Lembar Kasus</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  )
}
