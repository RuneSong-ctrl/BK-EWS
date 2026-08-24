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
  IconSearch,
  IconLoader,
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
  const [searchQuery, setSearchQuery] = React.useState("")

  // Map student_id => score string
  const [scores, setScores] = React.useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Helper to sanitize score strictly to integer 0 - 100
  const sanitizeIntegerScore = (raw: string): string => {
    if (raw === "") return ""
    const digitsOnly = raw.replace(/\D/g, "")
    if (digitsOnly === "") return ""
    let num = parseInt(digitsOnly, 10)
    if (isNaN(num)) return ""
    if (num > 100) num = 100
    if (num < 0) num = 0
    return String(num)
  }

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
          initial[st.id] = String(Math.round(Number(existingRecord.score)))
        } else {
          initial[st.id] = sanitizeIntegerScore(scores[st.id] || quickDefaultScore || "80")
        }
      })
      setScores(initial)
    }
  }, [isOpen, students, selectedSubjectId, assessmentType, periodName])

  const handleApplyDefaultToAll = () => {
    const val = sanitizeIntegerScore(quickDefaultScore)
    if (val === "") {
      toast({
        title: "Nilai Tidak Valid",
        description: "Masukkan angka bulat antara 0 sampai 100.",
        variant: "destructive",
      })
      return
    }
    const updated: Record<number, string> = {}
    students.forEach((st) => {
      updated[st.id] = val
    })
    setScores(updated)
    setQuickDefaultScore(val)
    toast({
      title: "Nilai Diterapkan ke Seluruh Siswa",
      description: `Seluruh ${students.length} siswa diisi nilai ${val}. Anda dapat mengedit nilai individual di bawah.`,
    })
  }

  const handleScoreChange = (studentId: number, val: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: sanitizeIntegerScore(val),
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

    const payloadScores = students.map((st) => {
      const parsed = parseInt(scores[st.id] || "0", 10)
      const clamped = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed))
      return {
        student_id: st.id,
        score: clamped,
      }
    })

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

  const filteredStudents = React.useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    )
  }, [students, searchQuery])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] max-w-4xl p-0 gap-0 overflow-hidden bg-[#EEF2F7] border border-slate-300/80 shadow-2xl rounded-3xl max-h-[88vh] flex flex-col z-[100]">
        {/* 1. Header (Clean right side so close button NEVER collides) */}
        <div className="p-4 sm:p-5 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0 pr-16">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90 shadow-2xs">
              <IconSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Input Rekap Nilai Akademik
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                {classNameTitle || "Kelas Binaan"} • Terintegrasi deteksi dini pilar Akademik (AK)
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* 2. Top Config Ribbon: Assessment Meta Fields */}
          <div className="p-4 sm:p-5 bg-[#E7EDF4]/60 border-b border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 shrink-0">
            {/* Subject Selector */}
            <div className="space-y-1.5 lg:col-span-4">
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
            <div className="space-y-1.5 lg:col-span-3">
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

            {/* Period / KD Name */}
            <div className="space-y-1.5 lg:col-span-5">
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
          </div>

          {/* 3. Sub-toolbar: KKM Indicator, Status Summary, & Spacious Bulk Score Setter */}
          <div className="p-3 sm:px-5 bg-[#E7EDF4]/40 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left: KKM & Rekap Summary */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <IconBook className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>KKM: <strong className="font-number font-extrabold text-slate-900">{passingGrade}</strong></span>
              </div>

              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-slate-600">
                <span>Tuntas: <strong className="font-number font-extrabold text-emerald-700">{countTuntas}</strong></span>
                <span className="text-slate-300">|</span>
                <span>Remedial: <strong className={cn("font-number font-extrabold", countRemedial > 0 ? "text-rose-600" : "text-slate-600")}>{countRemedial}</strong></span>
              </div>
            </div>

            {/* Right: Terapkan Serentak */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">Terapkan Serentak:</span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={quickDefaultScore}
                  onChange={(e) => setQuickDefaultScore(sanitizeIntegerScore(e.target.value))}
                  onKeyDown={(e) => {
                    if (['.', ',', '-', '+', 'e', 'E'].includes(e.key)) {
                      e.preventDefault()
                    }
                  }}
                  placeholder="80"
                  className="h-9 w-20 text-xs font-number font-extrabold text-center neo-inset bg-[#E7EDF4] border border-slate-300/40 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleApplyDefaultToAll}
                  className="h-9 px-3.5 text-xs font-bold neo-btn bg-[#EEF2F7] hover:bg-white text-indigo-700 border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-[0.98] flex items-center gap-1.5 shrink-0"
                >
                  <IconCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Set Semua Siswa</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Student List Scores Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
            {/* List Header & Optional Search */}
            <div className="flex items-center justify-between gap-3 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daftar Siswa ({filteredStudents.length} {filteredStudents.length !== students.length ? `dari ${students.length}` : ""})
              </span>
              
              {students.length > 8 && (
                <div className="relative w-48 sm:w-60">
                  <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau NISN..."
                    className="w-full h-8 pl-8 pr-2 text-xs neo-inset bg-[#E7EDF4] border border-slate-300/40 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden divide-y divide-slate-200/60 shadow-xs">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  Tidak ada siswa yang sesuai dengan kata kunci pencarian.
                </div>
              ) : (
                filteredStudents.map((student, idx) => {
                  const currentVal = scores[student.id] || ""
                  const numVal = parseInt(currentVal, 10)
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
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200/60 hidden sm:inline-flex items-center gap-1">
                            Remedial (&lt;{passingGrade})
                          </span>
                        )}
                        <div className="w-24">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={scores[student.id] ?? ""}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (['.', ',', '-', '+', 'e', 'E'].includes(e.key)) {
                                e.preventDefault()
                              }
                            }}
                            placeholder="80"
                            className={cn(
                              "h-9 text-xs sm:text-sm font-number font-extrabold text-center neo-inset border-0 rounded-xl transition-all",
                              isUnderKKM
                                ? "bg-rose-100/80 text-rose-900 focus:ring-rose-400"
                                : "bg-[#E7EDF4] text-slate-900 focus:ring-blue-400"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* 5. Footer Actions */}
          <DialogFooter className="p-3.5 sm:p-4 bg-[#EEF2F7] border-t border-slate-200/70 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Nilai &lt; KKM ({passingGrade}) otomatis diklasifikasikan sebagai <strong>Remedial</strong> dan memicu deteksi pilar Akademik.</span>
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
                className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all neo-btn-primary active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <IconLoader className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <IconSave className="w-4 h-4 text-white" />
                )}
                <span>{isSubmitting ? "Menyimpan Nilai..." : "Simpan Rekap Nilai"}</span>
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

