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
} from "@/components/ui/storage-icon"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface StudentItem {
  id: number
  name: string
  nisn: string
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

  // Initialize or reset scores when modal opens or student list changes
  React.useEffect(() => {
    if (isOpen) {
      const initial: Record<number, string> = {}
      students.forEach((st) => {
        initial[st.id] = scores[st.id] || "80"
      })
      setScores(initial)
    }
  }, [isOpen, students])

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
        period: periodName,
        academic_year: academicYear,
        scores: payloadScores,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Rekap Nilai Berhasil Disimpan",
            description: `Nilai ${assessmentType} (${periodName}) untuk ${students.length} siswa telah tercatat dan skor EWS dihitung ulang.`,
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

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId)
  const passingGrade = currentSubject?.passing_grade ?? 75

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-[#EEF2F7] border border-white/85 shadow-[6px_6px_16px_rgba(166,178,196,0.45),-6px_-6px_16px_rgba(255,255,255,0.95)] rounded-3xl max-h-[92vh] flex flex-col z-[100]">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0 pr-14">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconGraduationCap className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                Input Rekap Nilai Akademik Kelas {classNameTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                Catat nilai tugas, kuis, atau ulangan harian untuk mengaktifkan Pilar Akademik (AK) &amp; EWS.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Top Config Row: Subject, Assessment Type, Period */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl neo-inset bg-[#E7EDF4] border border-slate-300/40">
              {/* Subject Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Mata Pelajaran</Label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                  className="w-full h-10 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 px-3 text-xs font-bold text-slate-800 focus:outline-none transition-all cursor-pointer"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} (KKM: {sub.passing_grade ?? 75})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assessment Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Jenis Penilaian</Label>
                <div className="grid grid-cols-4 gap-1">
                  {(["TUGAS", "UH", "UTS", "UAS"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAssessmentType(type)}
                      className={cn(
                        "h-10 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                        assessmentType === type
                          ? "neo-btn-primary text-white shadow-xs font-extrabold border-transparent"
                          : "neo-btn bg-[#EEF2F7] text-slate-600 hover:text-slate-900 border-white/80"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period / Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Label / Periode Penilaian</Label>
                <Input
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="Misal: UH 1 / Tugas Bab 2"
                  className="h-10 text-xs font-bold rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Bulk Quick Fill Bar */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700">Isi Nilai Cepat:</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={quickDefaultScore}
                  onChange={(e) => setQuickDefaultScore(e.target.value)}
                  className="w-18 h-8 text-xs font-mono font-bold neo-inset bg-[#E7EDF4] text-center rounded-xl border-0"
                />
                <button
                  type="button"
                  onClick={handleApplyDefaultToAll}
                  className="h-8 px-3.5 text-xs font-bold neo-btn bg-[#EEF2F7] hover:bg-white text-indigo-700 border border-white/90 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Terapkan ke Semua ({students.length} Siswa)
                </button>
              </div>
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                Standar KKM: <strong className="text-slate-800 font-mono">{passingGrade}</strong>
              </span>
            </div>

            {/* Students Scores Table */}
            <div className="rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#E7EDF4] border-b border-slate-200/60 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="col-span-1 text-center font-mono">No</span>
                <span className="col-span-6 sm:col-span-7">Nama Siswa</span>
                <span className="col-span-5 sm:col-span-4 text-center">Nilai Angka (0 - 100)</span>
              </div>

              <div className="divide-y divide-slate-200/50 max-h-[300px] overflow-y-auto">
                {students.map((student, idx) => {
                  const currentVal = parseFloat(scores[student.id] || "0")
                  const isBelowKkm = !isNaN(currentVal) && currentVal < passingGrade

                  return (
                    <div
                      key={student.id}
                      className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-blue-50/30 transition-colors text-xs sm:text-sm"
                    >
                      <span className="col-span-1 text-center font-mono text-slate-400 font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div className="col-span-6 sm:col-span-7 min-w-0 pr-2">
                        <p className="font-extrabold text-slate-900 truncate">{student.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">NISN: {student.nisn || "-"}</p>
                      </div>
                      <div className="col-span-5 sm:col-span-4 flex items-center justify-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={scores[student.id] ?? ""}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className={cn(
                            "w-20 h-8 text-center font-mono font-bold text-xs rounded-xl transition-all border-0",
                            isBelowKkm
                              ? "neo-inset bg-amber-100/70 text-amber-900"
                              : "neo-inset bg-[#E7EDF4] text-slate-900"
                          )}
                          required
                        />
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-lg shrink-0 border",
                            isBelowKkm
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          )}
                        >
                          {isBelowKkm ? "Remedial" : "Tuntas"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <DialogFooter className="p-4 sm:p-5 bg-[#EEF2F7] border-t border-slate-200/70 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Data nilai akan dihitung otomatis ke rata-rata &amp; Pilar AK siswa.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl neo-btn bg-[#EEF2F7] text-slate-600 hover:text-slate-900 text-xs font-bold border border-white/90 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl neo-btn-primary text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
