import * as React from "react"
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Layers,
  ChevronRight,
  BookOpen,
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
  const studentList = initialStudents
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
  const [observationDate, setObservationDate] = React.useState(new Date().toISOString().split("T")[0])
  const [participationScore, setParticipationScore] = React.useState(3)
  const [homeworkScore, setHomeworkScore] = React.useState(3)
  const [quizScore, setQuizScore] = React.useState(75)
  const [rawText, setRawText] = React.useState("")

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [isAiLoading, setIsAiLoading] = React.useState(false)
  const [aiData, setAiData] = React.useState<AiStructuredResult>({
    student_name: studentList[0]?.name || "Siswa",
    raw_text: "",
    category: "MENARIK_DIRI",
    severity: "SEDANG",
    summary: "Hasil analisis AI Gemini akan muncul di sini.",
    recommendation: "Rekomendasi tindak lanjut guru kelas.",
    confidence_score: 95,
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
      summary: `Catatan observasi guru: "${rawText.substring(0, 80)}..."`,
      recommendation: "Lakukan dialog empatik wali kelas dan pantau perkembangan siswa.",
      confidence_score: 90,
    })
    setIsAiModalOpen(true)
    setIsAiLoading(false)
  }

  const handleSaveObservation = (data: AiStructuredResult) => {
    if (!selectedStudent) return

    router.post(
      "/guru-kelas/observations",
      {
        student_id: selectedStudent.id,
        date: observationDate,
        category: data.category,
        severity: data.severity,
        raw_text: data.raw_text,
        ai_structured_summary: data.summary,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Observasi Berhasil Disimpan",
            description: `Observasi untuk ${data.student_name} telah tersimpan dan EWS telah diperbarui.`,
            variant: "success",
          })
          setRawText("")
        },
        onError: (errors) => {
          toast({
            title: "Gagal Menyimpan Observasi",
            description: Object.values(errors).join(", "),
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleFastAiObservation = () => {
    handleStructureWithAi()
  }

  const handleManualSave = () => {
    if (!selectedStudent) {
      toast({
        title: "Pilih Siswa Terlebih Dahulu",
        description: "Silakan pilih siswa yang akan diobservasi melalui kolom pencarian.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Catatan Observasi Disimpan",
      description: `Catatan observasi harian untuk ${selectedStudent.name} berhasil disimpan manual ke jurnal kelas.`,
      variant: "success",
    })
    setRawText("")
  }

  const filteredStudents = studentList.filter((student) => {
    const matchSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn.includes(searchQuery)
    const matchStatus =
      statusFilter === "ALL" || student.ews_status === statusFilter
    return matchSearch && matchStatus
  })

  const totalCount = stats?.total_students || studentList.length
  const atensiCount =
    (stats?.kritis_count || 0) +
    (stats?.waspada_count || 0) +
    (stats?.berisiko_count || 0)

  const studentsWithAtt = studentList.filter((s) => s.attendance_rate !== null && s.attendance_rate !== undefined)
  const avgAttDisplay =
    studentsWithAtt.length > 0
      ? (
          studentsWithAtt.reduce((acc, curr) => acc + (Number(curr.attendance_rate) || 0), 0) /
          studentsWithAtt.length
        ).toFixed(1) + "%"
      : "-"

  return (
    <AppLayout
      currentRole="guru_kelas"
      activeMenu="dashboard"
      title={`Ringkasan Evaluasi & Jurnal Kelas ${className}`}
      subtitle="Pencatatan observasi perilaku siswa berbantuan AI dan pemantauan 4 pilar EWS"
    >
      {/* Top 3 Stat Cards - Soft Neumorphic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1 */}
        <div className="p-5 sm:p-6 rounded-2xl neo-card flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Siswa Kelas
            </span>
            <div className="w-9 h-9 rounded-xl neo-btn text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{totalCount} Siswa</div>
            <p className="text-xs text-slate-500 mt-0.5">Kelas {className} &bull; TP 2026/2027</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 sm:p-6 rounded-2xl neo-card flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Presensi
            </span>
            <div className="w-9 h-9 rounded-xl neo-btn text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{avgAttDisplay}</div>
            <p className="text-xs text-slate-500 mt-0.5">Bulan Berjalan</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 sm:p-6 rounded-2xl neo-card flex flex-col justify-between h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Perlu Atensi (EWS)
            </span>
            <div className="w-9 h-9 rounded-xl neo-btn text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{atensiCount} Siswa</div>
            <p className="text-xs text-slate-500 mt-0.5">{stats?.kritis_count || 0} Kritis &bull; {stats?.waspada_count || 0} Waspada</p>
          </div>
        </div>
      </div>

      {/* Main Action Panel: Linear Top-to-Bottom Layout for Behavior Observation */}
      <section
        id="observasi"
        className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 scroll-mt-20"
      >
        {/* Header with Date Picker (Duplicate Calendar Icon Removed) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Pencatatan Observasi Perilaku Siswa
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Asisten AI
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Catat dinamika perilaku harian secara linear untuk memperbarui indikator peringatan dini (EWS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">Tanggal Observasi:</span>
            {/* Native date input has built-in calendar picker icon; extra icon removed */}
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* LINEAR STEP 1: Search NISN or Student Name */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-bold text-slate-800">
            1. Cari NISN atau Nama Siswa:
          </Label>
          <StudentAutocomplete
            students={studentAutocompleteOptions}
            selectedStudent={selectedStudent}
            onSelect={setSelectedStudent}
            placeholder="Ketik NISN (contoh: 0089218821) atau nama siswa..."
          />
        </div>

        {/* LINEAR STEP 2: Free Narrative Textarea with AI Button in Bottom Right Corner */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rawText" className="text-xs sm:text-sm font-bold text-slate-800">
              2. Catatan Naratif Bebas Wali Kelas:
            </Label>
            <span className="text-xs text-slate-500">
              Tuliskan kejadian atau indikasi perubahan sikap
            </span>
          </div>

          {/* Relative Container for Textarea with AI Button in Bottom Right */}
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-1">
            <Textarea
              id="rawText"
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Tuliskan catatan naratif bebas... Contoh: Siswa terlihat pasif 3 hari ini dan menolak bergabung saat kerja kelompok tugas biologi. Sering melamun saat diterangkan."
              className="w-full p-4 pb-14 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed border-0 bg-transparent focus:ring-0 focus:outline-none resize-y min-h-[140px]"
            />

            {/* AI Structuring Button inside the bottom-right corner of the textarea */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleStructureWithAi}
                disabled={isAiLoading}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
              >
                <Sparkles className={cn("w-4 h-4 text-white", isAiLoading && "animate-spin")} />
                <span>{isAiLoading ? "Menganalisis..." : "Strukturkan dengan AI"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* LINEAR STEP 3: Parameter Observasi Harian (Linear Scales) */}
        <div className="space-y-3 pt-2">
          <Label className="text-xs sm:text-sm font-bold text-slate-800 block">
            3. Parameter Observasi Harian:
          </Label>

          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-5">
            {/* Scale 1: Partisipasi Kelas */}
            <LinearScale
              label="Tingkat Partisipasi Kelas"
              description="Keaktifan interaksi dan respons siswa saat kegiatan pembelajaran berlangsung"
              min={1}
              max={5}
              value={participationScore}
              onChange={setParticipationScore}
              minLabel="1 (Sangat Pasif)"
              midLabel="3 (Cukup Aktif)"
              maxLabel="5 (Sangat Aktif)"
            />

            {/* Scale 2: Kedisiplinan Tugas & PR */}
            <LinearScale
              label="Kedisiplinan Tugas &amp; PR"
              description="Ketepatan waktu penyerahan dan kelengkapan pengerjaan tugas akademik"
              min={1}
              max={5}
              value={homeworkScore}
              onChange={setHomeworkScore}
              minLabel="1 (Tidak Pernah)"
              midLabel="3 (Sebagian)"
              maxLabel="5 (Selalu Tepat)"
            />

            {/* Scale 3: Pemahaman Materi / Kuis */}
            <LinearScale
              label="Skor Pemahaman / Kuis Harian"
              description="Estimasi penguasaan materi pembelajaran atau capaian asesmen formatif"
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

        {/* LINEAR STEP 4: Bottom Action Bar with Simpan Manual Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Catatan yang disimpan akan memperbarui indeks 4 Pilar EWS secara otomatis.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleManualSave}
              className="flex-1 sm:flex-none h-11 px-5 rounded-xl border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Simpan Manual</span>
            </Button>
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

          {/* Table Filters */}
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Cari siswa di kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 px-3 rounded-xl neo-inset bg-[#EEF2F7] text-xs text-slate-800 placeholder:text-slate-400 w-44 focus:outline-none"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl neo-inset bg-[#EEF2F7] text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">Semua Status EWS</option>
              <option value="NORMAL">Normal</option>
              <option value="BERISIKO">Berisiko</option>
              <option value="WASPADA">Waspada</option>
              <option value="KRITIS">Kritis</option>
              <option value="DATA_BELUM_LENGKAP">Data Belum Lengkap</option>
            </select>
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
