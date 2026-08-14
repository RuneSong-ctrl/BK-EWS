import * as React from "react"
import { Sparkles, Check, AlertCircle, HeartHandshake, ShieldAlert } from "lucide-react"
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

export interface AiBkStructuredResult {
  student_name: string
  raw_text: string
  case_category: string
  urgency_level: "RINGAN" | "SEDANG" | "BERAT"
  psychosocial_summary: string
  counselor_intervention: string
  follow_up_action: string
  confidence_score?: number
}

interface AiBkStructuringModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: AiBkStructuredResult) => void
  initialData: AiBkStructuredResult
}

export function AiBkStructuringModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
}: AiBkStructuringModalProps) {
  const [formData, setFormData] = React.useState<AiBkStructuredResult>(initialData)

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
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Konfirmasi Strukturasi Sesi BK AI (Konselor)
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Strukturasi verbatim konseling dan rekomendasi intervensi untuk <strong className="text-slate-800 font-semibold">{formData.student_name}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3">
          {/* Left: Original Raw Verbatim Notes */}
          <div className="md:col-span-5 space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Catatan Verbatim Konseling (Teks Asli)
            </Label>
            <div className="p-4 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans min-h-[140px] border border-slate-200">
              <blockquote className="italic border-l-3 border-indigo-500 pl-2.5 text-slate-700">
                &ldquo;{formData.raw_text}&rdquo;
              </blockquote>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-2.5 text-xs text-indigo-900">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
              <span>Data sensitif konseling dienkripsi tingkat tinggi &amp; tunduk pada kode etik konselor BK.</span>
            </div>
          </div>

          {/* Right: AI Structured Inputs */}
          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">
                  Klasifikasi Kasus BK
                </Label>
                <Select
                  value={formData.case_category}
                  onValueChange={(val) => setFormData({ ...formData, case_category: val })}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Pilih Kategori Kasus" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-2xl z-[99999]">
                    <SelectItem value="PSIKOSOSIAL_ADAPTASI">Masalah Psikososial &amp; Penyesuaian Diri</SelectItem>
                    <SelectItem value="TEKANAN_AKADEMIK">Tekanan &amp; Stresor Akademik</SelectItem>
                    <SelectItem value="KONFLIK_PEER">Konflik Antar Teman Sebaya</SelectItem>
                    <SelectItem value="KEDISIPLINAN_TATA_TERTIB">Pelanggaran Tata Tertib &amp; Alpa</SelectItem>
                    <SelectItem value="MOTIVASI_KARIR">Bimbingan Karir &amp; Minat Belajar</SelectItem>
                    <SelectItem value="DUGAAN_BULLYING">Dugaan Bullying / Intimidasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">
                  Tingkat Urgensi Kasus
                </Label>
                <Select
                  value={formData.urgency_level}
                  onValueChange={(val: "RINGAN" | "SEDANG" | "BERAT") =>
                    setFormData({ ...formData, urgency_level: val })
                  }
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Pilih Urgensi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-2xl z-[99999]">
                    <SelectItem value="RINGAN">Ringan (Konseling Rutin)</SelectItem>
                    <SelectItem value="SEDANG">Sedang (Perlu Pemantauan Terarah)</SelectItem>
                    <SelectItem value="BERAT">Berat (Eskalasi Konferensi Kasus)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold text-slate-800">
                Ringkasan Dinamika Psikososial Siswa
              </Label>
              <Input
                value={formData.psychosocial_summary}
                onChange={(e) => setFormData({ ...formData, psychosocial_summary: e.target.value })}
                className="h-10 text-xs sm:text-sm bg-slate-50 border-slate-200 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold text-slate-800">
                Rekomendasi Intervensi Konselor
              </Label>
              <Textarea
                rows={2}
                value={formData.counselor_intervention}
                onChange={(e) => setFormData({ ...formData, counselor_intervention: e.target.value })}
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <Check className="w-4 h-4" />
            <span>Konfirmasi &amp; Simpan Log BK</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
