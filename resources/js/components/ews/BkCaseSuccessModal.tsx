import * as React from "react"
import {
  IconChevronRight,
  IconHandshake,
  IconFile,
} from "@/components/ui/storage-icon"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Link } from "@inertiajs/react"
import { cn } from "@/lib/utils"

export interface BkCaseSuccessDetail {
  student_id: number
  student_name: string
  class_name: string
  nisn: string
  date: string
  category: string
  severity: "RINGAN" | "SEDANG" | "BERAT"
  status: string
  follow_up: string[]
  notes: string
}

interface BkCaseSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onAddAnother: () => void
  detail: BkCaseSuccessDetail | null
}

const CATEGORY_MAP: Record<string, string> = {
  PSIKOSOSIAL_ADAPTASI: "Psikososial & Adaptasi",
  TEKANAN_AKADEMIK: "Tekanan Akademik",
  KONFLIK_PEER: "Konflik Teman Sebaya",
  KEDISIPLINAN_TATA_TERTIB: "Disiplin & Tata Tertib",
  MOTIVASI_KARIR: "Bimbingan Karir",
  DUGAAN_BULLYING: "Dugaan Bullying",
  SOSIAL_PERILAKU: "Sosial & Perilaku",
}

export function BkCaseSuccessModal({
  isOpen,
  onClose,
  onAddAnother,
  detail,
}: BkCaseSuccessModalProps) {
  if (!detail) return null

  const categoryLabel = CATEGORY_MAP[detail.category] || detail.category

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] max-w-xl p-0 gap-0 overflow-hidden bg-[#EEF2F7] border border-white/85 shadow-[6px_6px_16px_rgba(166,178,196,0.45),-6px_-6px_16px_rgba(255,255,255,0.95)] rounded-3xl max-h-[88vh] flex flex-col z-[100]">
        {/* Top Celebration Glow Banner */}
        <div className="relative p-4 sm:p-5 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0 pr-12">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl neo-btn text-indigo-700 flex items-center justify-center shrink-0 border border-white/90 shadow-2xs">
              <IconHandshake className="w-5 h-5 animate-in zoom-in-50 duration-300" />
            </div>

            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 text-indigo-800 border border-slate-200/80 shadow-2xs text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-500/20 animate-pulse" />
                <span>Tersimpan &amp; Pilar BK Terkalkulasi</span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Sesi Konseling Berhasil Dicatat
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500 font-medium leading-tight">
                Rekam bimbingan konseling telah tersimpan dan memperbarui skor EWS siswa.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body: Compact Card */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
          <div className="p-3.5 sm:p-4 rounded-2xl neo-inset bg-[#E7EDF4] border border-slate-300/40 space-y-2.5">
            {/* Student Info */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-300/50 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl neo-btn bg-[#EEF2F7] text-indigo-700 font-extrabold flex items-center justify-center shrink-0 text-xs border border-white/90 shadow-2xs">
                  {detail.student_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{detail.student_name}</h4>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    NISN: {detail.nisn || "-"} • Kelas {detail.class_name}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0">
                {detail.date}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/90 text-slate-800 border border-slate-200/80 shadow-2xs">
                {categoryLabel}
              </span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs bg-white/90",
                  detail.severity === "BERAT"
                    ? "border-rose-200 text-rose-800"
                    : detail.severity === "SEDANG"
                    ? "border-amber-200 text-amber-800"
                    : "border-emerald-200 text-emerald-800"
                )}
              >
                Urgensi {detail.severity}
              </span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/90 text-indigo-800 border border-slate-200/80 shadow-2xs">
                {detail.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Notes excerpt */}
            {detail.notes && (
              <div className="p-3 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 text-slate-800 leading-relaxed text-xs font-medium max-h-[120px] overflow-y-auto">
                "{detail.notes}"
              </div>
            )}

            {/* Follow-up Actions */}
            {detail.follow_up && detail.follow_up.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] font-bold text-slate-600">RTL:</span>
                {detail.follow_up.map((act, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white/90 text-indigo-800 border border-slate-200/80 shadow-2xs">
                    {act}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions - Fixed Bottom */}
        <DialogFooter className="p-3.5 sm:p-4 bg-[#EEF2F7] border-t border-slate-200/70 shrink-0 flex flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold rounded-xl neo-btn bg-[#EEF2F7] text-slate-700 hover:text-slate-900 border border-white/90 transition-all cursor-pointer shrink-0"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/students/${detail.student_id}`}
              className="px-3 py-2 rounded-xl neo-btn bg-[#EEF2F7] text-indigo-700 hover:text-indigo-900 border border-white/90 text-xs font-bold inline-flex items-center justify-center gap-1 transition-all shadow-2xs"
            >
              <span>Profil Siswa</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onAddAnother}
              className="px-3.5 py-2 text-xs font-bold neo-btn-primary text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <IconFile className="w-3.5 h-3.5 text-white" />
              <span>Input Sesi Lain</span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
