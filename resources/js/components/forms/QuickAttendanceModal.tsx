import * as React from "react"
import { router } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  IconCheck,
  IconCalendarCheck,
  IconAlert,
  IconSave,
} from "@/components/ui/storage-icon"
import { DatePickerInput } from "@/components/ui/date-picker-input"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export type AttendanceStatus = "HADIR" | "SAKIT" | "IZIN" | "ALPA" | "TERLAMBAT"

export interface AttendanceStudentItem {
  id: number
  name: string
  nisn: string
  gender?: string
  status: AttendanceStatus
  late_minutes?: number
  notes?: string
}

interface QuickAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  classNameTitle: string
  students: Array<{
    id: number
    name: string
    nisn: string
    gender?: string
  }>
}

export function QuickAttendanceModal({
  isOpen,
  onClose,
  classNameTitle,
  students,
}: QuickAttendanceModalProps) {
  const todayStr = React.useMemo(() => {
    const d = new Date()
    return d.toISOString().split("T")[0]
  }, [])

  const [date, setDate] = React.useState<string>(todayStr)
  const [attendanceData, setAttendanceData] = React.useState<AttendanceStudentItem[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Initialize or reset students list with default status HADIR
  React.useEffect(() => {
    if (students && students.length > 0) {
      setAttendanceData(
        students.map((s) => ({
          id: s.id,
          name: s.name,
          nisn: s.nisn,
          gender: s.gender,
          status: "HADIR",
          late_minutes: 0,
          notes: "",
        }))
      )
    }
  }, [students, isOpen])

  const handleStatusChange = (studentId: number, newStatus: AttendanceStatus) => {
    setAttendanceData((prev) =>
      prev.map((item) => (item.id === studentId ? { ...item, status: newStatus } : item))
    )
  }

  const handleNotesChange = (studentId: number, notes: string) => {
    setAttendanceData((prev) =>
      prev.map((item) => (item.id === studentId ? { ...item, notes } : item))
    )
  }

  const handleLateMinutesChange = (studentId: number, minutes: number) => {
    setAttendanceData((prev) =>
      prev.map((item) => (item.id === studentId ? { ...item, late_minutes: minutes } : item))
    )
  }

  const handleSetAll = (status: AttendanceStatus) => {
    setAttendanceData((prev) => prev.map((item) => ({ ...item, status })))
    toast({
      title: `Semua Siswa Ditandai ${status}`,
      description: `Seluruh siswa kelas ${classNameTitle} diatur ke status ${status}.`,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) {
      toast({
        title: "Pilih Tanggal Presensi",
        description: "Tanggal pelaksanaan presensi wajib ditentukan.",
        variant: "destructive",
      })
      return
    }

    if (attendanceData.length === 0) {
      toast({
        title: "Data Siswa Kosong",
        description: "Tidak ada siswa yang dapat dicatat absensinya.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const payload = {
      date,
      attendances: attendanceData.map((item) => ({
        student_id: item.id,
        status: item.status,
        late_minutes: item.status === "TERLAMBAT" ? item.late_minutes || 0 : 0,
        notes: item.notes || null,
      })),
    }

    router.post("/guru-kelas/attendance/bulk", payload, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "Presensi Berhasil Disimpan",
          description: `Rekap absensi tanggal ${date} untuk ${attendanceData.length} siswa berhasil diperbarui.`,
        })
        onClose()
      },
      onError: (errors) => {
        const errorMsg = Object.values(errors)[0] as string
        toast({
          title: "Gagal Menyimpan Presensi",
          description: errorMsg || "Terjadi kesalahan saat memproses data presensi.",
          variant: "destructive",
        })
      },
      onFinish: () => {
        setIsSubmitting(false)
      },
    })
  }

  // Summary counts
  const countHadir = attendanceData.filter((s) => s.status === "HADIR").length
  const countSakit = attendanceData.filter((s) => s.status === "SAKIT").length
  const countIzin = attendanceData.filter((s) => s.status === "IZIN").length
  const countAlpa = attendanceData.filter((s) => s.status === "ALPA").length
  const countTerlambat = attendanceData.filter((s) => s.status === "TERLAMBAT").length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] max-w-4xl p-0 gap-0 overflow-hidden bg-[#EEF2F7] border border-white/85 shadow-[6px_6px_20px_rgba(166,178,196,0.45),-6px_-6px_20px_rgba(255,255,255,0.95)] rounded-3xl max-h-[88vh] flex flex-col z-[100]">
        {/* 1. Header (Clean right side so close button NEVER collides) */}
        <div className="p-4 sm:p-5 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0 pr-16">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl neo-btn text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-white/90">
              <IconCalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Input Presensi Harian Kelas {classNameTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                Pilar Kehadiran (KH) • Terintegrasi deteksi dini risiko EWS
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* 2. Control & Summary Toolbar */}
        <div className="p-3 sm:px-5 bg-[#E7EDF4]/60 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Custom Neumorphic Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Tanggal KBM:</span>
            <DatePickerInput
              value={date}
              onChange={setDate}
              size="sm"
            />
          </div>

          {/* Counters in Middle */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg neo-pill bg-white text-emerald-800 border border-white/80 shadow-2xs">
              Hadir: <strong>{countHadir}</strong>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg neo-pill bg-white text-amber-800 border border-white/80 shadow-2xs">
              Sakit: <strong>{countSakit}</strong>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg neo-pill bg-white text-blue-800 border border-white/80 shadow-2xs">
              Izin: <strong>{countIzin}</strong>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg neo-pill bg-white text-rose-800 border border-white/80 shadow-2xs">
              Alpa: <strong>{countAlpa}</strong>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg neo-pill bg-white text-orange-800 border border-white/80 shadow-2xs">
              Telat: <strong>{countTerlambat}</strong>
            </span>
          </div>

          {/* Quick Action on Right */}
          <button
            type="button"
            onClick={() => handleSetAll("HADIR")}
            className="h-8 px-3 text-xs font-bold text-emerald-800 neo-btn bg-[#EEF2F7] hover:bg-white border border-white/90 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-[0.98]"
          >
            <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tandai Semua Hadir</span>
          </button>
        </div>

        {/* 3. Compact Roll-Call Sheet (Table Style with Segmented Switchers) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="rounded-2xl neo-card-subtle bg-[#EEF2F7] border border-white/90 overflow-hidden divide-y divide-slate-200/60 shadow-xs">
            {attendanceData.map((student, idx) => {
              const isAbnormal = student.status !== "HADIR"

              return (
                <div
                  key={student.id}
                  className={cn(
                    "p-3 sm:px-4 transition-colors hover:bg-white/60",
                    student.status === "ALPA"
                      ? "bg-rose-50/40"
                      : student.status === "TERLAMBAT"
                      ? "bg-orange-50/40"
                      : student.status === "SAKIT"
                      ? "bg-amber-50/40"
                      : student.status === "IZIN"
                      ? "bg-blue-50/40"
                      : ""
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Student Identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
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

                    {/* Compact 5-Segmented Tactile Controller */}
                    <div className="flex items-center p-1 rounded-xl neo-inset bg-[#E7EDF4] border border-slate-300/40 gap-1 shrink-0 self-end sm:self-auto">
                      {(
                        [
                          { id: "HADIR", label: "Hadir", activeCls: "bg-emerald-600 text-white font-extrabold shadow-xs" },
                          { id: "SAKIT", label: "Sakit", activeCls: "bg-amber-500 text-white font-extrabold shadow-xs" },
                          { id: "IZIN", label: "Izin", activeCls: "bg-blue-600 text-white font-extrabold shadow-xs" },
                          { id: "ALPA", label: "Alpa", activeCls: "bg-rose-600 text-white font-extrabold shadow-xs" },
                          { id: "TERLAMBAT", label: "Telat", activeCls: "bg-orange-500 text-white font-extrabold shadow-xs" },
                        ] as const
                      ).map((opt) => {
                        const isActive = student.status === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleStatusChange(student.id, opt.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-center select-none cursor-pointer",
                              isActive
                                ? opt.activeCls
                                : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-white/50"
                            )}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sub-row for Abnormal Status (Late Minutes & Notes) */}
                  {isAbnormal && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center gap-2">
                      {student.status === "TERLAMBAT" && (
                        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                          <Label className="text-[11px] font-bold text-slate-700 shrink-0">
                            Menit Telat:
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max="180"
                            value={student.late_minutes || ""}
                            placeholder="15"
                            onChange={(e) =>
                              handleLateMinutesChange(student.id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-7 text-xs font-bold neo-inset bg-[#E7EDF4] border-0 text-center rounded-lg"
                          />
                        </div>
                      )}
                      <Input
                        type="text"
                        value={student.notes || ""}
                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                        placeholder={
                          student.status === "SAKIT"
                            ? "Keterangan sakit / surat dokter..."
                            : student.status === "IZIN"
                            ? "Alasan izin keluarga / urusan mendesak..."
                            : student.status === "ALPA"
                            ? "Catatan ketidakhadiran tanpa kabar..."
                            : "Keterangan keterlambatan..."
                        }
                        className="h-7 text-xs flex-1 neo-inset bg-[#E7EDF4] border-0 text-slate-800 placeholder:text-slate-400 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-[#EEF2F7] border-t border-slate-200/70 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <IconAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Alpa berulang &ge; 3 hari otomatis memicu status EWS WASPADA/KRITIS.</span>
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
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all neo-btn-primary active:scale-[0.98]"
            >
              <IconSave className="w-4 h-4 text-white" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Rekap Presensi"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
