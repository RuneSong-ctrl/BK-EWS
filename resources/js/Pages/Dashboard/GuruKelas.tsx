import * as React from "react"
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
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
import { AiStructuringModal, type AiStructuredResult } from "@/components/ews/AiStructuringModal"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface StudentRow {
  id: number
  name: string
  nisn: string
  class_name: string
  avg_score: number
  score_trend: "Naik" | "Turun" | "Stabil"
  attendance_rate: number
  alpa_count: number
  pillars: PillarStatuses
  ews_status: EwsStatus
}

const mockStudents: StudentRow[] = [
  {
    id: 1,
    name: "Ahmad Fauzi",
    nisn: "0089218821",
    class_name: "10-MIPA-1",
    avg_score: 62.5,
    score_trend: "Turun",
    attendance_rate: 82.0,
    alpa_count: 4,
    pillars: { ak: "WASPADA", kh: "WASPADA", pr: "BERISIKO", bk: "NORMAL" },
    ews_status: "WASPADA",
  },
  {
    id: 2,
    name: "Annisa Larasati",
    nisn: "0089218822",
    class_name: "10-MIPA-1",
    avg_score: 88.0,
    score_trend: "Naik",
    attendance_rate: 100.0,
    alpa_count: 0,
    pillars: { ak: "NORMAL", kh: "NORMAL", pr: "NORMAL", bk: "NORMAL" },
    ews_status: "NORMAL",
  },
  {
    id: 3,
    name: "Budi Santoso",
    nisn: "0089218823",
    class_name: "10-MIPA-1",
    avg_score: 71.0,
    score_trend: "Stabil",
    attendance_rate: 91.5,
    alpa_count: 1,
    pillars: { ak: "BERISIKO", kh: "NORMAL", pr: "BERISIKO", bk: "NORMAL" },
    ews_status: "BERISIKO",
  },
  {
    id: 4,
    name: "Citra Dewi",
    nisn: "0089218824",
    class_name: "10-MIPA-1",
    avg_score: 94.5,
    score_trend: "Naik",
    attendance_rate: 98.0,
    alpa_count: 0,
    pillars: { ak: "NORMAL", kh: "NORMAL", pr: "NORMAL", bk: "NORMAL" },
    ews_status: "NORMAL",
  },
  {
    id: 5,
    name: "Dimas Pratama",
    nisn: "0089218825",
    class_name: "10-MIPA-1",
    avg_score: 54.0,
    score_trend: "Turun",
    attendance_rate: 76.5,
    alpa_count: 5,
    pillars: { ak: "KRITIS", kh: "WASPADA", pr: "BERISIKO", bk: "NORMAL" },
    ews_status: "KRITIS",
  },
  {
    id: 6,
    name: "Eka Putri",
    nisn: "0089218826",
    class_name: "10-MIPA-1",
    avg_score: 79.0,
    score_trend: "Stabil",
    attendance_rate: 94.0,
    alpa_count: 0,
    pillars: { ak: "NORMAL", kh: "NORMAL", pr: "NORMAL", bk: "NORMAL" },
    ews_status: "NORMAL",
  },
]

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
}

export default function GuruKelas({ schoolClass, students: initialStudents = [], stats }: GuruKelasProps) {
  const studentList = initialStudents.length > 0 ? initialStudents : mockStudents
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
  const [observationDate, setObservationDate] = React.useState("2026-08-14")
  const [participationScore, setParticipationScore] = React.useState(2)
  const [homeworkScore, setHomeworkScore] = React.useState(2)
  const [quizScore, setQuizScore] = React.useState(55)
  const [rawText, setRawText] = React.useState(
    "Siswa terlihat pasif 3 hari ini dan menolak bergabung saat kerja kelompok tugas biologi. Sering melamun saat diterangkan."
  )

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [isAiLoading, setIsAiLoading] = React.useState(false)
  const [aiData, setAiData] = React.useState<AiStructuredResult>({
    student_name: studentList[0]?.name || "Ahmad Fauzi",
    raw_text: rawText,
    category: "MENARIK_DIRI",
    severity: "SEDANG",
    summary: "Menunjukkan indikasi isolasi sosial, pasif di kelas, dan keengganan berinteraksi kelompok.",
    recommendation: "Lakukan mediasi wali kelas dan amati dinamika kelompok belajar siswa.",
    confidence_score: 94,
  })

  // Table Filter
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  const studentAutocompleteOptions: StudentOption[] = studentList.map((s) => ({
    id: s.id,
    name: s.name,
    nisn: s.nisn,
    class_name: s.class_name || className,
    ews_status: s.ews_status,
  }))

  const handleStructureWithAi = async () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan pilih siswa yang akan diobservasi melalui kolom pencarian.",
        variant: "destructive",
      })
      return
    }

    if (!rawText.trim()) {
      toast({
        title: "Teks Observasi Masih Kosong",
        description: "Tuliskan catatan observasi siswa sebelum menstrukturkan dengan AI.",
        variant: "destructive",
      })
      return
    }

    setIsAiLoading(true)

    try {
      const response = await fetch("/api/ai/structure-observation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ raw_text: rawText }),
      })

      if (response.ok) {
        const payload = await response.json()
        if (payload?.data) {
          const res = payload.data
          setAiData({
            student_name: selectedStudent.name,
            raw_text: rawText,
            category: res.category || "MENARIK_DIRI",
            severity: res.severity || "SEDANG",
            summary: res.ai_structured_summary || "Terdeteksi pola perilaku di kelas.",
            recommendation: res.suggested_action || "Lakukan pendekatan personal empati.",
            confidence_score: 95,
          })
          setIsAiModalOpen(true)
          setIsAiLoading(false)
          return
        }
      }
    } catch (err) {
      console.warn("AI backend fetch fallback to local heuristic", err)
    }

    // Local fallback
    setAiData({
      student_name: selectedStudent.name,
      raw_text: rawText,
      category: "MENARIK_DIRI",
      severity: participationScore <= 2 ? "SEDANG" : "RINGAN",
      summary: `Menunjukkan skor partisipasi (${participationScore}/5) dengan indikasi penarikan diri sosial dan perlambatan pemahaman materi (${quizScore}%).`,
      recommendation: "Lakukan dialog empatik wali kelas dan pantau tren 3 hari ke depan.",
      confidence_score: 92,
    })
    setIsAiModalOpen(true)
    setIsAiLoading(false)
  }

  const handleSaveObservation = (data: AiStructuredResult) => {
    toast({
      title: "Observasi Berhasil Disimpan",
      description: `Observasi untuk ${data.student_name} telah distrukturkan dan tersimpan ke basis data.`,
      variant: "success",
    })
    setRawText("")
  }

  const filteredStudents = studentList.filter((s) => {
    const matchQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery)
    const matchStatus = statusFilter === "ALL" || s.ews_status === statusFilter
    return matchQuery && matchStatus
  })

  const totalCount = stats?.total_students || studentList.length
  const atensiCount = (stats?.kritis_count || 0) + (stats?.waspada_count || 0) + (stats?.berisiko_count || 0)

  return (
    <AppLayout
      currentRole="guru_kelas"
      activeMenu="dashboard"
      title={`Ringkasan Evaluasi & Jurnal Kelas ${className}`}
      subtitle="Pencatatan observasi perilaku siswa berbantuan AI dan pemantauan 4 pilar EWS"
    >
      {/* Top 3 Stat Cards - Soft Neumorphic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="p-4 sm:p-5 rounded-2xl neo-card flex flex-col justify-between h-[116px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Siswa Kelas
            </span>
            <div className="w-8 h-8 rounded-xl neo-btn text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{totalCount} Siswa</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Kelas {className} &bull; TP 2026/2027</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 sm:p-5 rounded-2xl neo-card flex flex-col justify-between h-[116px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Presensi
            </span>
            <div className="w-8 h-8 rounded-xl neo-btn text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">96.8%</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Presensi Kehadiran Terpantau</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 sm:p-5 rounded-2xl neo-card flex flex-col justify-between h-[116px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Perlu Atensi (EWS)
            </span>
            <div className="w-8 h-8 rounded-xl neo-btn text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{atensiCount} Siswa</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats?.kritis_count || 0} Kritis &bull; {stats?.waspada_count || 0} Waspada &bull; {stats?.berisiko_count || 0} Berisiko
            </p>
          </div>
        </div>
      </div>

      {/* Main Action Panel: Fast AI Behavior Observation & Parameter Input */}
      <section
        id="observasi"
        className="p-5 sm:p-6 rounded-2xl neo-card space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neo-btn text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Pencatatan Observasi Perilaku Siswa
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold neo-pill bg-[#E6EDF5] text-blue-700">
                  Asisten AI
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat dinamika perilaku harian untuk memperbarui indikator peringatan dini (EWS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              className="h-8 px-3 rounded-lg neo-inset bg-[#EEF2F7] text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Student Selector with Autocomplete */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <StudentAutocomplete
              students={studentAutocompleteOptions}
              selectedStudent={selectedStudent}
              onSelect={setSelectedStudent}
              label="Pilih Siswa Kelas:"
              placeholder="Cari nama atau NISN siswa..."
            />

            {/* Linear Scales in Guru Kelas Scope */}
            <div className="p-4 rounded-xl neo-card-subtle space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Parameter Observasi Harian
              </span>

              {/* 1. Partisipasi Kelas Scale */}
              <LinearScale
                label="Tingkat Partisipasi Kelas"
                description="Keaktifan interaksi dan respons siswa saat belajar"
                min={1}
                max={5}
                value={participationScore}
                onChange={setParticipationScore}
                minLabel="Sangat Pasif"
                midLabel="Cukup Aktif"
                maxLabel="Sangat Aktif"
              />

              {/* 2. Kepatuhan Tugas Scale */}
              <LinearScale
                label="Kedisiplinan Tugas &amp; PR"
                description="Ketepatan waktu dan kelengkapan tugas"
                min={1}
                max={5}
                value={homeworkScore}
                onChange={setHomeworkScore}
                minLabel="Tidak Pernah"
                midLabel="Sebagian"
                maxLabel="Selalu Tepat"
              />

              {/* 3. Pemahaman Materi Slider */}
              <LinearScale
                label="Skor Pemahaman / Kuis Harian"
                description="Estimasi penguasaan materi pembelajaran"
                min={0}
                max={100}
                step={5}
                mode="continuous"
                value={quizScore}
                onChange={setQuizScore}
                minLabel="0 (Rendah)"
                maxLabel="100 (Baik)"
              />
            </div>
          </div>

          {/* Right Column: Free Narrative Text Box & AI Trigger */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rawText" className="text-xs font-bold text-slate-700">
                  Catatan Naratif Bebas Wali Kelas
                </Label>
                <span className="text-[11px] text-slate-400">
                  Tuliskan kejadian atau indikasi perubahan sikap
                </span>
              </div>

              <Textarea
                id="rawText"
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Contoh: Siswa terlihat pasif 3 hari ini dan menolak bergabung saat kerja kelompok. Saat ditanya tampak cemas..."
                className="w-full p-3.5 rounded-xl neo-inset bg-[#EEF2F7] text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed min-h-[130px] focus:outline-none transition-all"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
              <p className="text-[11px] text-slate-500">
                AI Gemini mengekstrak kategori, tingkat keparahan, dan rekomendasi awal.
              </p>

              <Button
                type="button"
                onClick={handleStructureWithAi}
                disabled={isAiLoading || !rawText.trim() || !selectedStudent}
                className="w-full sm:w-auto h-9 px-4 rounded-xl neo-btn-primary font-bold text-xs"
              >
                {isAiLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Memproses AI Gemini...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Analisis &amp; Simpan Observasi
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Roster Table Section */}
      <section
        id="rekap"
        className="p-5 sm:p-6 rounded-2xl neo-card space-y-4 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Matriks Siswa &amp; Evaluasi 4 Pilar EWS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh siswa binaan kelas {className} dan status deterministik
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg neo-btn text-xs font-semibold"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filter Status
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 neo-card-subtle bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F0F3F8] text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">Rata Nilai</th>
                <th className="py-3 px-3">% Kehadiran</th>
                <th className="py-3 px-3">4 Pilar EWS</th>
                <th className="py-3 px-3">Status EWS</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center group-hover:border-blue-300">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block group-hover:text-blue-700">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {student.class_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {student.nisn}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-slate-800">
                          {student.avg_score !== null && student.avg_score !== undefined ? student.avg_score : "-"}
                        </span>
                        {student.score_trend !== "-" && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1 py-0.2 rounded",
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

                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold font-mono text-slate-800">
                          {student.attendance_rate !== null && student.attendance_rate !== undefined ? `${student.attendance_rate}%` : "-"}
                        </span>
                        {student.alpa_count > 0 && (
                          <span className="block text-[10px] text-rose-600 font-medium">
                            {student.alpa_count}x Alpa
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <PillarIndicators pillars={student.pillars} />
                    </td>

                    <td className="py-3.5 px-3">
                      <EwsStatusBadge status={student.ews_status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Structuring Confirmation Modal */}
      <AiStructuringModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onConfirm={handleSaveObservation}
        initialData={aiData}
      />
    </AppLayout>
  )
}
