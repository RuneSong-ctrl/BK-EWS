import * as React from "react"
import { IconAlert, IconCheck, IconArrowRight, IconAi, IconMagicWand, IconRefresh } from "@/components/ui/storage-icon"
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
import { cn } from "@/lib/utils"

export interface AiDraftResult {
  student_name: string
  generated_narrative: string
  category: string
  severity: "RINGAN" | "SEDANG" | "BERAT"
  summary: string
  recommendation: string
  suggested_participation?: number
  suggested_homework?: number
  suggested_quiz?: number
  confidence_score?: number
}

// Backward compatibility type alias
export type AiStructuredResult = AiDraftResult

interface AiStructuringModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyToForm: (data: AiDraftResult) => void
  studentName: string
  initialRawText?: string
}

const PRESET_OPTIONS: Record<string, string[]> = {
  TIDAK_FOKUS: [
    "Sering mengantuk / tidur di kelas saat jam pelajaran",
    "Melamun dan tidak memperhatikan penjelasan guru",
    "Bermain gadget / HP tanpa izin selama KBM",
    "Pasif dan lambat merespon saat sesi tanya jawab",
  ],
  MENARIK_DIRI: [
    "Menyendiri dan tidak mau bergabung dalam kerja kelompok",
    "Tampak murung, lesu, dan enggan diajak komunikasi",
    "Menutup diri dari interaksi dengan teman sebaya",
    "Tampak cemas atau tertekan saat proses pembelajaran",
  ],
  PELANGGARAN_ATURAN: [
    "Terlambat masuk kelas berulang kali tanpa alasan jelas",
    "Tidak membawa perlengkapan belajar / tidak mengumpulkan tugas",
    "Meninggalkan kelas sebelum jam pelajaran selesai",
    "Pelanggaran kerapian / tata tertib seragam sekolah",
  ],
  AGRESIF_VERBAL: [
    "Mengejek atau berkata kasar kepada teman sekelas",
    "Membentak atau menyela guru dengan nada tidak sopan",
    "Terlibat adu mulut dan perselisihan antar-siswa",
    "Menunjukkan penolakan agresif terhadap arahan guru",
  ],
  AGRESIF_FISIK: [
    "Terlibat kontak fisik kasar / perkelahian di area kelas",
    "Mendorong atau merusak barang milik teman sekelas",
    "Terindikasi melakukan tindakan perundungan (bullying)",
  ],
  PERILAKU_POSITIF: [
    "Sangat aktif berpartisipasi dan membantu diskusi kelompok",
    "Menunjukkan inisiatif membantu guru dan teman sekelas",
    "Disiplin tinggi dan hasil tugas sangat memuaskan",
    "Menunjukkan sikap empati dan kepemimpinan positif",
  ],
}

function findBestMatchingPreset(cat: string, text: string): string {
  const presets = PRESET_OPTIONS[cat] || []
  if (presets.length === 0) return ""
  if (!text) return presets[0]

  const lowerText = text.toLowerCase()
  let bestMatch = presets[0]
  let maxScore = 0

  for (const p of presets) {
    const words = p.toLowerCase().split(/[\s,./-]+/)
    let score = 0
    for (const w of words) {
      if (w.length >= 3 && lowerText.includes(w)) {
        score += 2
      }
    }
    if (score > maxScore) {
      maxScore = score
      bestMatch = p
    }
  }

  return bestMatch
}

export function AiStructuringModal({
  isOpen,
  onClose,
  onApplyToForm,
  studentName,
  initialRawText = "",
}: AiStructuringModalProps) {
  const [category, setCategory] = React.useState<string>("TIDAK_FOKUS")
  const [presetTopic, setPresetTopic] = React.useState<string>("")
  const [severity, setSeverity] = React.useState<"RINGAN" | "SEDANG" | "BERAT">("RINGAN")
  const [customKeywords, setCustomKeywords] = React.useState<string>(initialRawText)
  const [generatedDraft, setGeneratedDraft] = React.useState<string>("")
  const [summary, setSummary] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  // Reset or initialize on open
  React.useEffect(() => {
    if (isOpen) {
      if (initialRawText && initialRawText.trim().length >= 3) {
        setCustomKeywords(initialRawText)
        // Auto-analyze & classify when teacher has already typed text in the textarea
        handleGenerate(initialRawText, true)
      } else {
        // IDLE STATE: DO NOT auto-call AI API when textarea is empty (Save AI tokens)
        setCustomKeywords("")
        setGeneratedDraft("")
        setSummary("")
        setCategory("TIDAK_FOKUS")
        setSeverity("RINGAN")
        setPresetTopic(PRESET_OPTIONS["TIDAK_FOKUS"][0])
        setIsLoading(false)
      }
    }
  }, [isOpen, initialRawText])

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat)
    const availablePresets = PRESET_OPTIONS[newCat] || []
    if (availablePresets.length > 0) {
      setPresetTopic(availablePresets[0])
    } else {
      setPresetTopic("")
    }
  }

  const handleGenerate = async (overrideKeywords?: string, isAutoDetect = false) => {
    setIsLoading(true)
    const rawKeywords = overrideKeywords !== undefined ? overrideKeywords : customKeywords
    const effectiveText = (rawKeywords && rawKeywords.trim().length > 0)
      ? rawKeywords.trim()
      : (presetTopic || "Siswa diobservasi terkait dinamika belajar dan perilakunya di kelas")

    try {
      const response = await fetch("/api/ai/structure-observation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          raw_text: effectiveText,
          category: isAutoDetect ? null : category,
          severity: isAutoDetect ? null : severity,
          preset_topic: presetTopic,
          keywords: effectiveText,
          student_name: studentName,
        }),
      })

      if (response.ok) {
        const payload = await response.json()
        if (payload?.data) {
          const res = payload.data
          const detectedCategory = res.category || category
          
          // Automatically update Category Dropdown
          setCategory(detectedCategory)

          // Automatically select and highlight the closest matching preset chip
          const matchedChip = findBestMatchingPreset(detectedCategory, effectiveText)
          setPresetTopic(matchedChip)

          // Automatically update Severity
          if (res.severity) {
            setSeverity(res.severity)
          }

          setGeneratedDraft(res.generated_narrative || res.ai_structured_summary || "")
          setSummary(res.ai_structured_summary || "Terdeteksi pola perilaku di kelas.")
          setIsLoading(false)
          return
        }
      }
    } catch (err) {
      console.warn("AI Generate fetch error", err)
    }

    // Local smart fallback generator if network/API unavailable
    const student = studentName || "Siswa"
    let draftText = ""
    let sum = ""

    if (category === "MENARIK_DIRI") {
      draftText = `${student} tampak lebih pendiam dan cenderung menyendiri saat kegiatan kelas maupun diskusi kelompok. Disarankan pendekatan personal empati oleh wali kelas.`
      sum = "Siswa tampak murung atau mengisolasi diri dari interaksi kelas."
    } else if (category === "AGRESIF_VERBAL") {
      draftText = `${student} menunjukkan ucapan atau nada bicara yang kurang pantas kepada rekan saat jam pelajaran. Telah diberikan teguran lisan terstruktur.`
      sum = "Menunjukkan agresi verbal atau ketidaksopanan bertutur."
    } else if (category === "AGRESIF_FISIK") {
      draftText = `${student} terindikasi terlibat kontak fisik atau perselisihan kasar di area kelas. Memerlukan penanganan klarifikasi dan mediasi bersama Guru BK.`
      sum = "Terlibat insiden fisik atau pelanggaran keselamatan."
    } else if (category === "PERILAKU_POSITIF") {
      draftText = `${student} menunjukkan inisiatif dan partisipasi yang sangat baik dalam pembelajaran hari ini, serta membantu rekan sekelompok menyelesaikan tugas.`
      sum = "Menunjukkan inisiatif positif dan kolaborasi aktif."
    } else {
      draftText = `${student} terlihat kurang fokus dan beberapa kali mengantuk saat KBM berlangsung (${presetTopic || "jam pelajaran"}). Perlu konfirmasi pola istirahat.`
      sum = "Kurang fokus pada materi pembelajaran di kelas."
    }

    setGeneratedDraft(draftText)
    setSummary(sum)
    setIsLoading(false)
  }

  const handleApply = () => {
    onApplyToForm({
      student_name: studentName,
      generated_narrative: generatedDraft,
      category,
      severity,
      summary,
      recommendation: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xl z-[100] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <IconAi className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Asisten Penulisan Jurnal AI</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Sistem Siap</span>
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Bantu buatkan draf catatan naratif untuk <strong className="text-slate-800 font-semibold">{studentName || "Siswa"}</strong> secara cepat dan terstruktur
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* STEP 1: Quick Selection Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F7FA] border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Langkah 1: Pilih Topik &amp; Parameter Observasi
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Pilih opsi cepat tanpa perlu mengetik panjang
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Kategori Perilaku
                </Label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-slate-200 shadow-2xs">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-2xl z-[99999]">
                    <SelectItem value="TIDAK_FOKUS">Tidak Fokus / Disrupsi Belajar</SelectItem>
                    <SelectItem value="MENARIK_DIRI">Menarik Diri / Isu Emosional</SelectItem>
                    <SelectItem value="PELANGGARAN_ATURAN">Pelanggaran Tata Tertib / Kerapian</SelectItem>
                    <SelectItem value="AGRESIF_VERBAL">Agresi Verbal / Konflik Teman</SelectItem>
                    <SelectItem value="AGRESIF_FISIK">Agresi Fisik / Perundungan</SelectItem>
                    <SelectItem value="PERILAKU_POSITIF">Perilaku Positif / Kolaboratif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Tingkat Urgensi (Severity)
                </Label>
                <Select
                  value={severity}
                  onValueChange={(val: "RINGAN" | "SEDANG" | "BERAT") => setSeverity(val)}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-slate-200 shadow-2xs">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-2xl z-[99999]">
                    <SelectItem value="RINGAN">Ringan &bull; Observasi Berkala Wali Kelas</SelectItem>
                    <SelectItem value="SEDANG">Sedang &bull; Perlu Dialog Khusus</SelectItem>
                    <SelectItem value="BERAT">Berat &bull; Butuh Koordinasi BK Segera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Preset Incident Chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Pilihan Cepat Kejadian / Gejala Perilaku:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {(PRESET_OPTIONS[category] || []).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPresetTopic(preset)
                      setCustomKeywords(preset)
                    }}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer text-left font-medium",
                      presetTopic === preset
                        ? "bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Custom Keywords Input */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-slate-700">
                Kata Kunci Tambahan Guru (Opsional):
              </Label>
              <div className="flex gap-2">
                <Input
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  placeholder="Contoh: saat kerja kelompok jam ke-3, duduk di baris belakang"
                  className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isLoading ? (
                    <IconRefresh className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconMagicWand className="w-4 h-4" />
                  )}
                  <span>Generate Draf dengan AI</span>
                </Button>
              </div>
            </div>
          </div>

          {/* STEP 2: Live AI Generated Narrative Preview & Structured Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>Langkah 2: Draf Catatan Naratif Hasil AI</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Dapat Diedit
                </span>
              </Label>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <IconRefresh className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                <span>{isLoading ? "Sedang Menyusun..." : "Buat Ulang Variasi"}</span>
              </button>
            </div>

            <Textarea
              rows={3}
              value={generatedDraft}
              onChange={(e) => setGeneratedDraft(e.target.value)}
              placeholder="Belum ada draf. Pilih kategori/gejala di Langkah 1 atau ketik kata kunci singkat, lalu klik 'Generate Draf dengan AI'..."
              className="text-xs sm:text-sm text-slate-800 bg-white border-slate-200 rounded-2xl p-4 leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans min-h-[100px] shadow-2xs"
            />

            {/* AI Summary Card */}
            {summary && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-700">
                  <IconAi className="w-3.5 h-3.5" />
                  <span>Ringkasan Identifikasi AI:</span>
                </div>
                <div className="text-slate-700">
                  {summary}
                </div>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-2.5 text-xs text-blue-900">
              <IconAlert className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <span className="font-semibold">Catatan Alur: </span>
                <span>
                  Mengklik tombol konfirmasi di bawah akan memasang draf narasi ini ke <strong>Langkah 2: Catatan Naratif</strong>. Anda dapat membaca, menyunting teks, dan mengatur slider evaluasi harian secara manual sebelum menyimpan.
                </span>
              </div>
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
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleApply}
            disabled={!generatedDraft || generatedDraft.trim().length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <IconCheck className="w-4 h-4" />
            <span>Konfirmasi &amp; Pasang ke Catatan Naratif</span>
            <IconArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

