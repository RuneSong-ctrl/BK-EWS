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
  Save,
} from "lucide-react"
import { Link, router } from "@inertiajs/react"
import { AppLayout } from "@/Layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EwsStatusBadge, type EwsStatus } from "@/components/ews/EwsStatusBadge"
import { PillarIndicators, type PillarStatuses } from "@/components/ews/PillarIndicators"
import { LinearScale } from "@/components/forms/LinearScale"
import { StudentAutocomplete, type StudentOption } from "@/components/forms/StudentAutocomplete"
import { AiBkStructuringModal, type AiBkStructuredResult } from "@/components/ews/AiBkStructuringModal"
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

interface GuruBkProps {
  students?: { data: any[] }
  stats?: {
    total_students: number
    normal_count: number
    berisiko_count: number
    waspada_count: number
    kritis_count: number
    data_belum_lengkap_count: number
  }
  classes?: any[]
  watchlist?: any[]
  recentCases?: BkCaseItem[]
  allStudentOptions?: StudentOption[]
}

export default function GuruBk({
  students,
  stats,
  watchlist: initialWatchlist = [],
  recentCases: initialRecentCases = [],
  allStudentOptions: initialStudentOptions = [],
}: GuruBkProps) {
  const studentOptions = initialStudentOptions
  const watchlist = initialWatchlist
  const recentCases = initialRecentCases

  const [selectedStudent, setSelectedStudent] = React.useState<StudentOption | null>(
    studentOptions.length > 0 ? studentOptions[0] : null
  )
  const [urgencyScore, setUrgencyScore] = React.useState(3)
  const [rapportScore, setRapportScore] = React.useState(3)
  const [resolutionProgress, setResolutionProgress] = React.useState(0)
  const [sessionType, setSessionType] = React.useState("KONSELING_INDIVIDU")
  const [confidentialNotes, setConfidentialNotes] = React.useState("")
  const [callParent, setCallParent] = React.useState(false)
  const [referPsychologist, setReferPsychologist] = React.useState(false)
  const [escalateKepsek, setEscalateKepsek] = React.useState(false)

  // AI BK Modal State
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [isAiLoading, setIsAiLoading] = React.useState(false)
  const [aiBkData, setAiBkData] = React.useState<AiBkStructuredResult>({
    student_name: studentOptions[0]?.name || "Siswa",
    raw_text: "",
    case_category: "PSIKOSOSIAL_ADAPTASI",
    urgency_level: "SEDANG",
    psychosocial_summary: "Analisis konseling akan dibuat di sini.",
    counselor_intervention: "Rencana intervensi konselor.",
    follow_up_action: "Tindak lanjut pendampingan.",
    confidence_score: 95,
  })

  // Filters
  const [gradeFilter, setGradeFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  const handleStructureWithAi = async () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Pilih siswa melalui kolom pencarian sebelum menstrukturkan dengan AI.",
        variant: "destructive",
      })
      return
    }

    if (!confidentialNotes.trim()) {
      toast({
        title: "Catatan Konseling Masih Kosong",
        description: "Tuliskan catatan verbatim konseling sebelum menstrukturkan dengan AI.",
        variant: "destructive",
      })
      return
    }

    setIsAiLoading(true)

    // Local / Heuristic AI Structuring for BK
    setTimeout(() => {
      setAiBkData({
        student_name: selectedStudent.name,
        raw_text: confidentialNotes,
        case_category: urgencyScore >= 4 ? "KEDISIPLINAN_TATA_TERTIB" : "PSIKOSOSIAL_ADAPTASI",
        urgency_level: urgencyScore >= 4 ? "BERAT" : urgencyScore === 3 ? "SEDANG" : "RINGAN",
        psychosocial_summary: `Analisis catatan konseling: "${confidentialNotes.substring(0, 100)}..."`,
        counselor_intervention: "Lakukan pendampingan konseling individu terstruktur dan pantau dinamika belajar di kelas.",
        follow_up_action: callParent ? "Komunikasi koordinasi dengan orang tua" : "Konseling lanjutan pekan depan",
        confidence_score: 94,
      })
      setIsAiLoading(false)
      setIsAiModalOpen(true)
    }, 600)
  }

  const handleConfirmAiData = (data: AiBkStructuredResult) => {
    if (!selectedStudent) return

    router.post(
      "/guru-bk/cases",
      {
        student_id: selectedStudent.id,
        incident_date: new Date().toISOString().split("T")[0],
        reported_date: new Date().toISOString().split("T")[0],
        case_types: ["SOSIAL_PERILAKU"],
        bullying_role: null,
        severity: data.urgency_level || "SEDANG",
        status: escalateKepsek ? "DIESKALASI_KE_KEPSEK" : "DALAM_PROSES",
        follow_up_actions: [data.follow_up_action || "Konseling Individu"],
        involved_students_count: 1,
        confidential_notes: `${data.raw_text}\n\n[Ringkasan AI]: ${data.psychosocial_summary}\n[Intervensi]: ${data.counselor_intervention}`,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Log Kasus BK Berhasil Disimpan",
            description: `Rekam konseling untuk ${data.student_name} tersimpan dan status EWS diperbarui.`,
            variant: "success",
          })
          setConfidentialNotes("")
        },
        onError: (err) => {
          toast({
            title: "Gagal Menyimpan Kasus",
            description: Object.values(err).join(", "),
            variant: "destructive",
          })
        },
      }
    )
  }

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

    router.post(
      "/guru-bk/cases",
      {
        student_id: selectedStudent.id,
        incident_date: new Date().toISOString().split("T")[0],
        reported_date: new Date().toISOString().split("T")[0],
        case_types: ["SOSIAL_PERILAKU"],
        bullying_role: null,
        severity: urgencyScore >= 4 ? "BERAT" : urgencyScore === 3 ? "SEDANG" : "RINGAN",
        status: escalateKepsek ? "DIESKALASI_KE_KEPSEK" : "DALAM_PROSES",
        follow_up_actions: [callParent ? "Panggil Orang Tua" : "Konseling Individu"],
        involved_students_count: 1,
        confidential_notes: confidentialNotes,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Sesi Konseling Berhasil Disimpan",
            description: `Log konseling untuk ${selectedStudent.name} tersimpan di rekam medis BK.`,
            variant: "success",
          })
          setConfidentialNotes("")
        },
        onError: (err) => {
          toast({
            title: "Gagal Menyimpan Kasus",
            description: Object.values(err).join(", "),
            variant: "destructive",
          })
        },
      }
    )
  }

  const studentDataList = students?.data || []
  const holisticList: HolisticStudentItem[] = studentDataList.map((s: any) => ({
    id: s.id,
    name: s.name,
    nisn: s.nisn,
    class_name: s.classes?.[0]?.name || s.class_name || "-",
    grade: s.classes?.[0]?.name?.startsWith("10") ? "X" : s.classes?.[0]?.name?.startsWith("11") ? "XI" : "XII",
    pillars: {
      ak: s.ews_score?.academic_sub_status || "DATA_BELUM_LENGKAP",
      kh: s.ews_score?.attendance_sub_status || "DATA_BELUM_LENGKAP",
      pr: s.ews_score?.behavior_sub_status || "NORMAL",
      bk: s.ews_score?.bk_sub_status || "NORMAL"
    },
    ews_status: s.ews_score?.status || "DATA_BELUM_LENGKAP",
    trigger_reason: s.ews_score?.triggered_by_parameters?.join(", ") || "Data pilar dikumpulkan",
  }))

  const filteredMatrix = holisticList.filter((item) => {
    const matchGrade = gradeFilter === "ALL" || item.grade === gradeFilter
    const matchStatus = statusFilter === "ALL" || item.ews_status === statusFilter
    return matchGrade && matchStatus
  })

  const totalSchool = stats?.total_students || studentOptions.length
  const kritisSchool = stats?.kritis_count || 0
  const waspadaSchool = stats?.waspada_count || 0
  const activeCasesCount = recentCases.filter((c) => c.status === "DALAM_PROSES" || c.status === "BARU_DILAPORKAN").length

  return (
    <AppLayout
      currentRole="guru_bk"
      activeMenu="dashboard_bk"
      title="Portofolio Bimbingan Konseling & Watchlist EWS"
      subtitle="Pemantauan siswa berisiko tinggi dan penanganan kasus lintas kelas sekolah"
    >
      {/* Top 4 Elevated Stat Cards - Scaled for 14"-16" screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between h-[126px] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kasus Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">14 Kasus</div>
            <p className="text-xs text-slate-500 mt-0.5">Lintas Kelas X, XI, XII</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between h-[126px] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status Kritis
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-rose-600 tracking-tight font-mono">
              2 Siswa
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Perlu Penanganan Khusus</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between h-[126px] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dalam Mediasi
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">5 Kasus</div>
            <p className="text-xs text-slate-500 mt-0.5">Sesi Berjalan Pekan Ini</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between h-[126px] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kasus Selesai
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">28 Kasus</div>
            <p className="text-xs text-slate-500 mt-0.5">Semester Berjalan</p>
          </div>
        </div>
      </div>

      {/* Main Action Panel: Linear Top-to-Bottom Layout with AI Structuring for Guru BK */}
      <section
        id="kasus"
        className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Pencatatan Sesi Konseling &amp; Penanganan Kasus
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Konselor BK &bull; AI
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Dokumentasi terenkripsi rekam bimbingan dan tindak lanjut psikososial siswa tersusun linear
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Kerahasiaan Data Terjamin (UU PDP No. 27/2022)</span>
          </div>
        </div>

        <form onSubmit={handleSaveCounselingSession} className="space-y-6">
          {/* LINEAR STEP 1: Cross-Class Autocomplete */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-800">
              1. Pilih Siswa (Lintas Seluruh Kelas):
            </Label>
            <StudentAutocomplete
              students={mockAllStudents}
              selectedStudent={selectedStudent}
              onSelect={setSelectedStudent}
              placeholder="Cari siswa seluruh sekolah berdasarkan nama atau NISN..."
            />
          </div>

          {/* LINEAR STEP 2: Service Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-800">
              2. Jenis Layanan / Sesi Konseling:
            </Label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="KONSELING_INDIVIDU">Konseling Individu Personal</option>
              <option value="MEDIASI_PEER">Mediasi Konflik Teman Sebaya</option>
              <option value="BIMBINGAN_KELOMPOK">Bimbingan Kelompok Terarah</option>
              <option value="KONFERENSI_ORTU">Konferensi Kasus Bersama Wali Murid</option>
            </select>
          </div>

          {/* LINEAR STEP 3: Confidential Verbatim Notes with AI Button in Bottom Right */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidentialNotes" className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>3. Catatan Sesi Konseling Verbatim (Enkripsi Berlapis):</span>
              </Label>
              <span className="text-xs text-slate-500">
                Akses konselor BK
              </span>
            </div>

            {/* Relative Container for Textarea with AI Button in Bottom Right */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-1">
              <Textarea
                id="confidentialNotes"
                rows={5}
                value={confidentialNotes}
                onChange={(e) => setConfidentialNotes(e.target.value)}
                placeholder="Tuliskan catatan verbatim konseling, dinamika psikososial, dan observasi afektif siswa..."
                className="w-full p-4 pb-14 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed border-0 bg-transparent focus:ring-0 focus:outline-none resize-y min-h-[150px]"
              />

              {/* AI Structuring Button inside the bottom-right corner of the textarea */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStructureWithAi}
                  disabled={isAiLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
                >
                  <Sparkles className={cn("w-4 h-4 text-white", isAiLoading && "animate-spin")} />
                  <span>{isAiLoading ? "Menganalisis..." : "Strukturkan dengan AI"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* LINEAR STEP 4: Evaluation Scales & Follow-Up Plans */}
          <div className="space-y-4 pt-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
              4. Parameter Evaluasi Konseling BK:
            </Label>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-5">
              {/* Scale 1: Urgensi Kasus */}
              <LinearScale
                label="Tingkat Urgensi / Keparahan Kasus"
                description="Penilaian ancaman terhadap iklim belajar dan psikososial siswa"
                min={1}
                max={5}
                value={urgencyScore}
                onChange={setUrgencyScore}
                minLabel="1 (Rutin)"
                midLabel="3 (Perhatian)"
                maxLabel="5 (Kritis)"
              />

              {/* Scale 2: Indeks Keterbukaan */}
              <LinearScale
                label="Indeks Keterbukaan &amp; Rapport Siswa"
                description="Tingkat kooperatif, kejujuran narasi, dan refleksi diri saat sesi berlangsung"
                min={1}
                max={5}
                value={rapportScore}
                onChange={setRapportScore}
                minLabel="1 (Resisten)"
                midLabel="3 (Kooperatif)"
                maxLabel="5 (Sangat Terbuka)"
              />

              {/* Scale 3: Progres Resolusi */}
              <LinearScale
                label="Progres Resolusi Kasus"
                description="Persentase pemulihan dan pencapaian target komitmen yang disepakati"
                min={0}
                max={100}
                step={10}
                mode="continuous"
                value={resolutionProgress}
                onChange={setResolutionProgress}
                minLabel="0% (Baru)"
                maxLabel="100% (Tuntas)"
              />

              {/* Rencana Tindak Lanjut Checkboxes */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  Rencana Tindak Lanjut &amp; Eskalasi Kasus:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={callParent}
                      onChange={(e) => setCallParent(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Panggil Orang Tua</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={referPsychologist}
                      onChange={(e) => setReferPsychologist(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Rujuk ke Psikolog/PPA</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-rose-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={escalateKepsek}
                      onChange={(e) => setEscalateKepsek(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Eskalasi ke Kepala Sekolah</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* LINEAR STEP 5: Bottom Action Bar with Simpan Manual & Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Sesi yang tersimpan akan memperbarui Pilar BK dalam skor EWS siswa secara otomatis.
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                className="flex-1 sm:flex-none h-11 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Simpan Catatan Konseling</span>
              </Button>
            </div>
          </div>
        </form>
      </section>

      {/* Split Section: Watchlist & Recent Cases Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Priority EWS Watchlist */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Siswa Prioritas Penanganan (Watchlist)
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {mockWatchlist.length} Siswa
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Siswa berstatus Kritis &amp; Waspada yang memerlukan perhatian khusus
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {mockWatchlist.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{item.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">
                        {item.class_name}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Faktor Pemicu: <span className="text-slate-900 font-semibold">{item.trigger}</span>
                    </p>
                  </div>

                  <EwsStatusBadge status={item.status} size="sm" />
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs sm:text-sm">
                  <span className="text-xs text-amber-700 font-bold">
                    {item.urgency}
                  </span>
                  <Link
                    href={`/students/${item.id}`}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Buka Lembar BK</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Counseling Case Feed */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Riwayat Sesi Konseling Terkini
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Progres penanganan dan status tindak lanjut kasus siswa
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {mockRecentCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 hover:bg-slate-100/70 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{caseItem.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {caseItem.student_name} ({caseItem.class_name}) &bull; {caseItem.date}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-xs font-bold uppercase",
                      caseItem.status === "DIESKALASI_KE_KEPSEK"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : caseItem.status === "DALAM_PROSES"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}
                  >
                    {caseItem.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Konselor: {caseItem.counselor}</span>
                  <span
                    className={cn(
                      "font-bold",
                      caseItem.severity === "BERAT" ? "text-rose-600" : "text-slate-700"
                    )}
                  >
                    Kategori: {caseItem.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Holistic Student Matrix Across School */}
      <section
        id="matriks"
        className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Matriks Siswa Seluruh Sekolah (Cross-Class EWS)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Konsolidasi 4 pilar EWS di seluruh jenjang kelas (X, XI, XII)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Semua Status EWS</option>
              <option value="NORMAL">Normal</option>
              <option value="BERISIKO">Berisiko</option>
              <option value="WASPADA">Waspada</option>
              <option value="KRITIS">Kritis</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-[#F0F3F8] text-slate-600 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Siswa</th>
                <th className="py-3.5 px-3">Kelas / Jenjang</th>
                <th className="py-3.5 px-3">Pilar AK</th>
                <th className="py-3.5 px-3">Pilar KH</th>
                <th className="py-3.5 px-3">Pilar PR</th>
                <th className="py-3.5 px-3">Pilar BK</th>
                <th className="py-3.5 px-3">Status EWS</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatrix.map((student) => (
                <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900">
                    {student.name}
                    <span className="block text-xs text-slate-400 font-normal font-mono">
                      NISN: {student.nisn}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                      {student.class_name}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.ak} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.kh} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.pr} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.pillars.bk} size="sm" showDot={false} />
                  </td>
                  <td className="py-4 px-3">
                    <EwsStatusBadge status={student.ews_status} size="sm" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/students/${student.id}`}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 p-2 rounded-xl hover:bg-indigo-50"
                    >
                      <span>Lembar Kasus</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI BK Structuring Modal */}
      <AiBkStructuringModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onConfirm={handleConfirmAiData}
        initialData={aiBkData}
      />
    </AppLayout>
  )
}
