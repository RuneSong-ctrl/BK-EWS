import * as React from "react"
import { Sparkles, Check, AlertCircle, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface AiStructuredResult {
  student_name: string
  raw_text: string
  category: string
  severity: "RINGAN" | "SEDANG" | "BERAT"
  summary: string
  recommendation: string
  confidence_score?: number
}

interface AiStructuringModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: AiStructuredResult) => void
  initialData: AiStructuredResult
}

export function AiStructuringModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
}: AiStructuringModalProps) {
  const [formData, setFormData] = React.useState<AiStructuredResult>(initialData)

  React.useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const handleConfirm = () => {
    onConfirm(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-6 sm:rounded-2xl neo-card border border-white bg-white/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                Konfirmasi Strukturasi Observasi AI
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Tinjau dan sesuaikan klasifikasi otomatis untuk <strong className="text-slate-800">{formData.student_name}</strong> sebelum disimpan ke basis data
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3">
          {/* Left: Original Raw Text */}
          <div className="md:col-span-5 space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Catatan Observasi Guru (Teks Asli)
            </Label>
            <div className="p-3.5 rounded-xl neo-inset bg-[#F0F3F8] text-xs text-slate-700 leading-relaxed font-sans min-h-[140px] border border-slate-200/80">
              <blockquote className="italic border-l-2 border-blue-400 pl-2 text-slate-600">
                &ldquo;{formData.raw_text}&rdquo;
              </blockquote>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/60 flex items-center gap-2 text-[11px] text-blue-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Model AI memproses data dengan kepatuhan privasi (UU PDP).</span>
            </div>
          </div>

          {/* Right: AI Structured Inputs */}
          <div className="md:col-span-7 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kategori Perilaku
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-9 text-xs neo-inset bg-[#F0F3F8] border-slate-200">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENARIK_DIRI">Menarik Diri / Isolasi</SelectItem>
                    <SelectItem value="DISRUPSI_KELAS">Disrupsi Kelas / Gaduh</SelectItem>
                    <SelectItem value="KEDISIPLINAN">Kedisiplinan / Keterlambatan</SelectItem>
                    <SelectItem value="AGRESI_VERBAL">Agresi Verbal / Konflik</SelectItem>
                    <SelectItem value="BULLYING_TERDUGA">Terduga Bullying / Intimidasi</SelectItem>
                    <SelectItem value="PROSOSIAL">Perilaku Positif / Kolaboratif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Tingkat Keparahan (Severity)
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(val: "RINGAN" | "SEDANG" | "BERAT") =>
                    setFormData({ ...formData, severity: val })
                  }
                >
                  <SelectTrigger className="h-9 text-xs neo-inset bg-[#F0F3F8] border-slate-200">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RINGAN">Ringan (Observasi Rutin)</SelectItem>
                    <SelectItem value="SEDANG">Sedang (Perlu Perhatian)</SelectItem>
                    <SelectItem value="BERAT">Berat (Eskalasi BK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Ringkasan Formal Terstruktur (Dapat Diedit)
              </Label>
              <Input
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="h-9 text-xs neo-inset bg-[#F0F3F8] border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Saran Tindak Lanjut Awal
              </Label>
              <Textarea
                rows={2}
                value={formData.recommendation}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="text-xs neo-inset bg-[#F0F3F8] border-slate-200 min-h-[60px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3.5 flex sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Batal / Edit Ulang
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleConfirm}
              className="neo-button bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Konfirmasi &amp; Simpan Observasi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
