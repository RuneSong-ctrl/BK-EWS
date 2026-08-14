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
      <DialogContent className="max-w-3xl p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-2xl z-[100]">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Konfirmasi Strukturasi Observasi AI (Wali Kelas)
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tinjau dan sesuaikan klasifikasi otomatis untuk <strong className="text-slate-800 font-semibold">{formData.student_name}</strong> sebelum disimpan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3">
          {/* Left: Original Raw Text */}
          <div className="md:col-span-5 space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Catatan Observasi Guru (Teks Asli)
            </Label>
            <div className="p-4 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans min-h-[140px] border border-slate-200">
              <blockquote className="italic border-l-3 border-blue-500 pl-2.5 text-slate-700">
                &ldquo;{formData.raw_text}&rdquo;
              </blockquote>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <span>Model AI memproses data dengan kepatuhan privasi (UU PDP No. 27/2022).</span>
            </div>
          </div>

          {/* Right: AI Structured Inputs */}
          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">
                  Kategori Perilaku
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-2xl z-[99999]">
                    <SelectItem value="MENARIK_DIRI">Menarik Diri / Isolasi</SelectItem>
                    <SelectItem value="TIDAK_FOKUS">Tidak Fokus / Disrupsi Belajar</SelectItem>
                    <SelectItem value="PELANGGARAN_ATURAN">Pelanggaran Tata Tertib / Aturan</SelectItem>
                    <SelectItem value="AGRESIF_VERBAL">Agresi Verbal / Konflik Teman</SelectItem>
                    <SelectItem value="AGRESIF_FISIK">Agresi Fisik / Perundungan</SelectItem>
                    <SelectItem value="PERILAKU_POSITIF">Perilaku Positif / Kolaboratif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">
                  Tingkat Keparahan (Severity)
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(val: "RINGAN" | "SEDANG" | "BERAT") =>
                    setFormData({ ...formData, severity: val })
                  }
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-2xl z-[99999]">
                    <SelectItem value="RINGAN">Ringan (Observasi Rutin)</SelectItem>
                    <SelectItem value="SEDANG">Sedang (Perlu Perhatian)</SelectItem>
                    <SelectItem value="BERAT">Berat (Eskalasi BK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold text-slate-800">
                Ringkasan Formal Terstruktur (Dapat Diedit)
              </Label>
              <Input
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="h-10 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold text-slate-800">
                Saran Tindak Lanjut Awal
              </Label>
              <Textarea
                rows={2}
                value={formData.recommendation}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-xl min-h-[64px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl w-full sm:w-auto"
          >
            Batal / Edit Ulang
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <Check className="w-4 h-4" />
            <span>Konfirmasi &amp; Simpan Observasi</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
