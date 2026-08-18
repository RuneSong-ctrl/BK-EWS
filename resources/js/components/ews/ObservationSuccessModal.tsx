import * as React from "react"
import { Link } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IconCheck,
  IconChevronRight,
  IconBook,
} from "@/components/ui/storage-icon"
import { cn } from "@/lib/utils"

export interface SavedObservationDetail {
  student_id: number
  student_name: string
  nisn: string
  class_name: string
  date: string
  category: string
  severity: "RINGAN" | "SEDANG" | "BERAT"
  narrative: string
  scores: {
    participation: number
    homework: number
    quiz: number
  }
}

interface ObservationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onAddAnother: () => void
  detail: SavedObservationDetail | null
}

const CATEGORY_LABELS: Record<string, string> = {
  TIDAK_FOKUS: "Tidak Fokus / Disrupsi Belajar",
  MENARIK_DIRI: "Menarik Diri / Isolasi Sosial",
  PELANGGARAN_ATURAN: "Pelanggaran Tata Tertib / Tugas",
  AGRESIF_VERBAL: "Agresi Verbal / Perselisihan",
  AGRESIF_FISIK: "Agresi Fisik / Perkelahian",
  PERILAKU_POSITIF: "Perilaku Positif / Prestasi",
}

export function ObservationSuccessModal({
  isOpen,
  onClose,
  onAddAnother,
  detail,
}: ObservationSuccessModalProps) {
  if (!detail) return null

  const categoryLabel = CATEGORY_LABELS[detail.category] || detail.category

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] max-w-xl p-0 gap-0 overflow-hidden bg-[#EEF2F7] border border-white/85 shadow-[6px_6px_16px_rgba(166,178,196,0.45),-6px_-6px_16px_rgba(255,255,255,0.95)] rounded-3xl max-h-[88vh] flex flex-col z-[100]">
        {/* Compact Celebration Header Banner */}
        <div className="relative p-4 sm:p-5 bg-[#EEF2F7] border-b border-slate-200/70 shrink-0 pr-12">
          {/* Ambient Glows */}
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl neo-btn text-emerald-600 flex items-center justify-center shrink-0 border border-white/90 shadow-2xs">
              <IconCheck className="w-5 h-5 text-emerald-600 animate-in zoom-in-50 duration-300" />
            </div>

            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 text-emerald-800 border border-slate-200/80 shadow-2xs text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
                <span>Tersimpan &amp; EWS Terkalkulasi</span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Observasi Berhasil Dicatat
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500 font-medium leading-tight">
                Jurnal observasi perilaku harian telah diverifikasi dan tersimpan ke riwayat siswa.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body: Compact Card */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
          <div className="p-3.5 sm:p-4 rounded-2xl neo-inset bg-[#E7EDF4] border border-slate-300/40 space-y-2.5">
            {/* Student Identity Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-300/50 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl neo-btn bg-[#EEF2F7] text-blue-700 font-extrabold flex items-center justify-center shrink-0 text-xs border border-white/90 shadow-2xs">
                  {detail.student_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                    {detail.student_name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    NISN: {detail.nisn || "-"} • Kelas {detail.class_name}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0">
                {detail.date}
              </span>
            </div>

            {/* Badges: Category & Urgency */}
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
                Tingkat {detail.severity}
              </span>
            </div>

            {/* Narrative Excerpt */}
            {detail.narrative && (
              <div className="p-3 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90 text-slate-800 leading-relaxed text-xs font-medium max-h-[120px] overflow-y-auto">
                "{detail.narrative}"
              </div>
            )}

            {/* Mini Score Scales (3 Scales) */}
            <div className="grid grid-cols-3 gap-2 pt-0.5 text-center font-mono">
              <div className="p-2 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90">
                <span className="text-[10px] text-slate-500 block font-sans">Keaktifan</span>
                <span className="font-extrabold text-slate-900 text-xs">{detail.scores.participation}/5</span>
              </div>
              <div className="p-2 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90">
                <span className="text-[10px] text-slate-500 block font-sans">Ketertiban</span>
                <span className="font-extrabold text-slate-900 text-xs">{detail.scores.homework}/5</span>
              </div>
              <div className="p-2 rounded-xl neo-card-subtle bg-[#EEF2F7] border border-white/90">
                <span className="text-[10px] text-slate-500 block font-sans">Konsentrasi</span>
                <span className="font-extrabold text-slate-900 text-xs">
                  {detail.scores.quiz > 5 ? Math.round(detail.scores.quiz / 20) : detail.scores.quiz}/5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions - Always Visible at Bottom */}
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
              className="px-3 py-2 rounded-xl neo-btn bg-[#EEF2F7] text-blue-700 hover:text-blue-900 border border-white/90 text-xs font-bold inline-flex items-center justify-center gap-1 transition-all shadow-2xs"
            >
              <span>Profil Siswa</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onAddAnother}
              className="px-3.5 py-2 text-xs font-bold neo-btn-primary text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <IconBook className="w-3.5 h-3.5 text-white" />
              <span>Input Siswa Lain</span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
