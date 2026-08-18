import * as React from "react"
import { router } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  IconGraduationCap,
  IconCheck,
  IconBook,
  IconSave,
  IconSpreadsheet,
} from "@/components/ui/storage-icon"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface StudentItem {
  id: number
  name: string
  nisn: string
  academic_records?: Array<{
    id: number
    subject_id: number
    assessment_type: string
    period: string
    score: number
  }>
}

interface SubjectItem {
  id: number
  code: string
  name: string
  passing_grade?: number
}

interface QuickAcademicModalProps {
  isOpen: boolean
  onClose: () => void
  classNameTitle: string
  students: StudentItem[]
  subjects: SubjectItem[]
}

type AssessmentType = "TUGAS" | "UH" | "UTS" | "UAS"

export function QuickAcademicModal({
  isOpen,
  onClose,
  classNameTitle,
  students,
  subjects,
}: QuickAcademicModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number>(
    subjects[0]?.id || 1
  )
  const [assessmentType, setAssessmentType] = React.useState<AssessmentType>("UH")
  const [periodName, setPeriodName] = React.useState("Ulangan Harian 1")
  const [academicYear, setAcademicYear] = React.useState("2026/2027")
  const [quickDefaultScore, setQuickDefaultScore] = React.useState("80")

  // Map student_id => score string
  const [scores, setScores] = React.useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isSemesterExam = assessmentType === "UTS" || assessmentType === "UAS"

  const handleAssessmentTypeChange = (newType: AssessmentType) => {
    setAssessmentType(newType)
    if (newType === "UTS") {
      setPeriodName("Penilaian Tengah Semester (PTS)")
    } else if (newType === "UAS") {
      setPeriodName("Penilaian Akhir Semester (PAS)")
    } else if (newType === "UH") {
      setPeriodName("Ulangan Harian 1")
    } else if (newType === "TUGAS") {
      setPeriodName("Tugas 1")
    }
  }

  // Initialize or load existing scores when modal opens or subject/period changes
  React.useEffect(() => {
    if (isOpen && students.length > 0) {
      const initial: Record<number, string> = {}
      students.forEach((st) => {
        const existingRecord = st.academic_records?.find(
          (rec) =>
            rec.subject_id === selectedSubjectId &&
            rec.assessment_type === assessmentType &&
            rec.period === periodName
        )
        if (existingRecord && existingRecord.score !== undefined && existingRecord.score !== null) {
          initial[st.id] = String(existingRecord.score)
        } else {
          initial[st.id] = scores[st.id] || quickDefaultScore || "80"
        }
      })
      setScores(initial)
    }
  }, [isOpen, students, selectedSubjectId, assessmentType, periodName])

  const handleApplyDefaultToAll = () => {
    const val = quickDefaultScore.trim()
    if (!val || isNaN(Number(val))) return
    const updated: Record<number, string> = {}
    students.forEach((st) => {
      updated[st.id] = val
    })
    setScores(updated)
    toast({
      title: "Nilai Diterapkan ke Seluruh Siswa",
      description: `Seluruh ${students.length} siswa diisi nilai ${val}. Anda dapat mengedit nilai individual di bawah.`,
    })
  }

  const handleScoreChange = (studentId: number, val: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: val,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const currentPeriod =
      periodName.trim() ||
      (assessmentType === "UTS"
        ? "Penilaian Tengah Semester (PTS)"
        : assessmentType === "UAS"
        ? "Penilaian Akhir Semester (PAS)"
        : assessmentType === "UH"
        ? "Ulangan Harian 1"
        : "Tugas 1")

    const payloadScores = students.map((st) => ({
      student_id: st.id,
      score: parseFloat(scores[st.id] || "0"),
    }))

    setIsSubmitting(true)
    router.post(
      "/guru-kelas/academics/bulk",
      {
        subject_id: selectedSubjectId,
        assessment_type: assessmentType,
        period: currentPeriod,
        academic_year: academicYear,
        scores: payloadScores,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Rekap Nilai Berhasil Disimpan",
            description: `Nilai ${assessmentType} (${currentPeriod}) untuk ${students.length} siswa telah tercatat dan skor EWS dihitung ulang.`,
          })
          onClose()
        },
        onError: () => {
          toast({
            title: "Gagal Menyimpan Nilai",
            description: "Pastikan seluruh format nilai angka valid (0 - 100).",
            variant: "destructive",
          })
        },
        onFinish: () => {
          setIsSubmitting(false)
        },
      }
    )
  }

  // Count remedial vs tuntas live
  const passingGrade =
    subjects.find((s) => s.id === selectedSubjectId)?.passing_grade ?? 75

  const countRemedial = students.filter((st) => {
    const val = parseFloat(scores[st.id] || "0")
    return val < passingGrade
  }).length

  const countTuntas = students.length - countRemedial

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full bg-[#EEF2F7] border border-white/90 p-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90 shadow-2xs">
                <IconSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Input Rekap Nilai Akademik
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  {classNameTitle || "Kelas Binaan"} • Terintegrasi deteksi dini pilar Akademik (AK)
                </DialogDescription>
              </div>
            </div>

            {/* Quick Status Chips */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/90 text-emerald-800 border border-slate-200/80 shadow-2xs">
                Tuntas: <strong>{countTuntas}</strong>
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/90 text-amber-800 border border-slate-200/80 shadow-2xs">
                Remedial: <strong>{countRemedial}</strong>
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Top Config Ribbon */}
          <div className="p-4 sm:p-5 bg-[#E7EDF4]/60 border-b border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 shrink-0">
            {/* Subject Selector */}
            <div className="space-y-1 lg:col-span-4">
              <Label className="text-xs font-bold text-slate-700">Mata Pelajaran</Label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/40 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} (KKM: {sub.passing_grade ?? 75})
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Type */}
            <div className="space-y-1 lg:col-span-3">
              <Label className="text-xs font-bold text-slate-700">Jenis Penilaian</Label>
              <select
                value={assessmentType}
                onChange={(e) => handleAssessmentTypeChange(e.target.value as AssessmentType)}
                className="w-full h-10 px-3 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/40 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="UH">Ulangan Harian (UH)</option>
                <option value="TUGAS">Tugas / PR Mandiri</option>
                <option value="UTS">UTS / Penilaian Tengah Semester</option>
                <option value="UAS">UAS / Penilaian Akhir Semester</option>
              </select>
            </div>

            {/* Period / KD Name (Always shown for manual text input) */}
            <div className="space-y-1 lg:col-span-3">
              <Label className="text-xs font-bold text-slate-700">Label / Nama Penilaian</Label>
              <Input
                type="text"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                placeholder={
                  assessmentType === "UH"
                    ? "Misal: UH 1 - Aljabar"
                    : assessmentType === "TUGAS"
                    ? "Misal: Tugas 1 - Resensi"
                    : assessmentType === "UTS"
                    ? "Misal: UTS Semester Ganjil"
                    : "Misal: PAS Semester Genap"
                }
                className="h-10 text-xs font-bold neo-inset bg-[#E7EDF4] border border-slate-300/40"
                required
              />
            </div>

            {/* Quick Bulk Filler */}
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Terapkan Serentak</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={quickDefaultScore}
                  onChange={(e) => setQuickDefaultScore(e.target.value)}
                  className="h-10 w-14 text-xs font-mono font-bold text-center neo-inset bg-[#E7EDF4] border border-slate-300/40"
                />
                <button
                  type="button"
                  onClick={handleApplyDefaultToAll}
                  className="flex-1 h-10 px-2 text-xs font-bold neo-btn bg-[#EEF2F7] hover:bg-white text-indigo-800 border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                >
                  Set Semua
                </button>
              </div>
            </div>
          </div>

          {/* Student List Scores Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Daftar Siswa ({students.length})</span>
              <span>Nilai (0 - 100)</span>
            </div>

            <div className="rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden divide-y divide-slate-200/60 shadow-xs">
              {students.map((student, idx) => {
                const currentVal = scores[student.id] || ""
                const numVal = parseFloat(currentVal)
                const isUnderKKM = !isNaN(numVal) && numVal < passingGrade

                return (
                  <div
                    key={student.id}
                    className={cn(
                      "p-3 sm:px-4 flex items-center justify-between gap-3 transition-colors hover:bg-white/60",
                      isUnderKKM && "bg-rose-50/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg neo-inset bg-[#E7EDF4] font-mono text-xs font-extrabold text-slate-600 flex items-center justify-center shrink-0 border border-slate-300/30">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate block">
                          {student.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 truncate block">
                          NISN: {student.nisn || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUnderKKM && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 hidden sm:inline">
                          Remedial (&lt;{passingGrade})
                        </span>
                      )}
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={scores[student.id] ?? ""}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          placeholder="80"
                          className={cn(
                            "h-9 text-xs sm:text-sm font-mono font-extrabold text-center neo-inset border-0 rounded-xl transition-all",
                            isUnderKKM
                              ? "bg-rose-100/80 text-rose-900 focus:ring-rose-400"
                              : "bg-[#E7EDF4] text-slate-900 focus:ring-blue-400"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 bg-[#EEF2F7] border-t border-slate-200/70 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <IconBook className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>KKM Mata Pelajaran: <strong>{passingGrade}</strong>. Nilai &lt; KKM otomatis masuk pemicu pilar EWS.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 neo-btn bg-[#EEF2F7] border border-white/90 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all neo-btn-primary active:scale-[0.98]"
              >
                <IconSave className="w-4 h-4 text-white" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Rekap Nilai"}</span>
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
